import Layout from "@/components/Layout";
import LoadingSeed from "@/components/LoadingSeed";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/LocaleProvider";
import ReactMarkdown from "react-markdown";
import {
  AudioLines,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CloudSun,
  Download,
  Image as ImageIcon,
  Languages,
  Mic,
  RefreshCw,
  Save,
  Share2,
  Sprout,
  Volume2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { compressImage, isImageFile, validateImageSize } from "@/lib/image-utils";

interface AdvisoryResult {
  title: string;
  text: string;
  steps: string[];
  lang: string;
}

type Section = "menu" | "ask" | "image" | "updates" | "loading" | "result";

export default function Index() {
  const { t, lang, setLang } = useLocale();
  const [section, setSection] = useState<Section>("menu");
  const [question, setQuestion] = useState("");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<AdvisoryResult | null>(null);
  const [saved, setSaved] = useState<AdvisoryResult[]>([]);
  const [location, setLocation] = useState<{lat: number, lon: number} | null>(null);
  const recognitionRef = useRef<any>(null);
  const advisoryRef = useRef<HTMLDivElement>(null);

  // Cleanup speech when component unmounts or section changes
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
      setSpeaking(false);
    };
  }, []);

  // Stop speech when navigating away from result section
  useEffect(() => {
    if (section !== 'result' && speaking) {
      speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, [section, speaking]);

  // Handle URL query parameters for direct navigation
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (action === 'ask') setSection('ask');
    else if (action === 'image') setSection('image');
    else if (action === 'updates') setSection('updates');
  }, []);

  // Get user's geolocation for weather updates
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Default to approximate center of India
          setLocation({ lat: 20.5937, lon: 78.9629 });
        }
      );
    } else {
      setLocation({ lat: 20.5937, lon: 78.9629 });
    }
  }, []);

  useEffect(() => {
    const s = localStorage.getItem("saved-advisories");
    if (s) setSaved(JSON.parse(s));
  }, []);

  useEffect(() => {
    localStorage.setItem("saved-advisories", JSON.stringify(saved));
  }, [saved]);

  const firstVisit = useMemo(() => {
    return !localStorage.getItem("lang");
  }, [lang]);

  const startListening = () => {
    const WSR: any = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!WSR) {
      alert("Speech recognition not supported on this device");
      return;
    }
    const rec = new WSR();
    recognitionRef.current = rec;
    const speechMap: Record<string, string> = {
      en: "en-US",
      ml: "ml-IN",
      hi: "hi-IN",
      mr: "mr-IN",
      kn: "kn-IN",
      gu: "gu-IN",
      te: "te-IN",
    };
    rec.lang = speechMap[lang] || "en-US";
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join(" ");
      setQuestion(transcript);
    };
    rec.onend = () => setListening(false);
    rec.start();
    setListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop?.();
    setListening(false);
  };

  const speak = (text: string) => {
    // Check if speech synthesis is supported
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser. Please try Chrome, Firefox, or Safari.');
      return;
    }

    // If already speaking, stop current speech
    if (speaking) {
      speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    // Clean the text - remove HTML tags and markdown
    const cleanText = text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic markdown
      .replace(/\n+/g, '. ') // Replace newlines with periods
      .trim();

    if (!cleanText) return;

    // Wait for voices to load, then speak
    const speakWithVoices = () => {
      const voices = speechSynthesis.getVoices();
      console.log('Available voices:', voices.length);
      
      const utter = new SpeechSynthesisUtterance(cleanText);
      
      const speechMap: Record<string, string> = {
        en: "en-US",
        ml: "ml-IN", 
        hi: "hi-IN",
        mr: "mr-IN",
        kn: "kn-IN",
        gu: "gu-IN",
        te: "te-IN",
      };
      
      const targetLang = speechMap[lang] || "en-US";
      utter.lang = targetLang;
      
      // Enhanced voice selection logic
      let voice = null;
      
      // First, try to find exact language match
      voice = voices.find(v => v.lang === targetLang);
      
      // If no exact match, try language code match (e.g., 'hi' for 'hi-IN')
      if (!voice) {
        const langCode = targetLang.substring(0, 2);
        voice = voices.find(v => v.lang.startsWith(langCode));
      }
      
      // If still no match, try looking for language in voice name
      if (!voice) {
        const langNames = {
          'hi': ['hindi', 'हिंदी'],
          'ml': ['malayalam', 'മലയാളം'],
          'mr': ['marathi', 'मराठी'],
          'kn': ['kannada', 'ಕನ್ನಡ'],
          'gu': ['gujarati', 'ગુજરાતી'],
          'te': ['telugu', 'తెలుగు']
        };
        
        const langCode = targetLang.substring(0, 2);
        const searchNames = langNames[langCode as keyof typeof langNames] || [];
        
        voice = voices.find(v => 
          searchNames.some(name => 
            v.name.toLowerCase().includes(name.toLowerCase()) ||
            v.lang.toLowerCase().includes(name.toLowerCase())
          )
        );
      }
      
      // Fallback to any available voice that's not English
      if (!voice && targetLang !== 'en-US') {
        voice = voices.find(v => !v.lang.startsWith('en'));
      }
      
      // Final fallback to English or first available voice
      if (!voice) {
        voice = voices.find(v => v.lang.startsWith('en')) || voices[0];
      }
      
      if (voice) {
        utter.voice = voice;
        console.log('Using voice:', voice.name, 'Language:', voice.lang, 'Target:', targetLang);
      } else {
        console.log('No suitable voice found, using system default');
      }
      
      // Log all available voices for debugging
      console.log('All available voices:', voices.map(v => ({ name: v.name, lang: v.lang })));
      
      // Audio settings for better compatibility
      utter.rate = 0.8;
      utter.pitch = 1;
      utter.volume = 1;
      
      // Set up event listeners with detailed logging
      utter.onstart = () => {
        console.log('🔊 Speech started successfully');
        setSpeaking(true);
      };
      
      utter.onend = () => {
        console.log('✅ Speech completed');
        setSpeaking(false);
      };
      
      utter.onerror = (event) => {
        console.error('❌ Speech error:', event.error);
        setSpeaking(false);
        
        // Show user-friendly error message
        if (event.error === 'network') {
          alert('Network error: Please check your internet connection and try again.');
        } else if (event.error === 'not-allowed') {
          alert('Audio permission denied. Please allow audio in your browser settings and try again.');
        } else {
          alert('Speech synthesis failed. Please try again or check your browser audio settings.');
        }
      };
      
      // Cancel any existing speech and speak
      speechSynthesis.cancel();
      console.log('🎤 Starting speech synthesis...');
      speechSynthesis.speak(utter);
      
      // Fallback: Check if speech actually started after a delay
      setTimeout(() => {
        if (!speechSynthesis.speaking && !speechSynthesis.pending) {
          console.warn('⚠️ Speech may not have started. Trying fallback...');
          setSpeaking(false);
          // Try with a simpler approach
          const simpleUtter = new SpeechSynthesisUtterance('Test');
          simpleUtter.onstart = () => {
            // If test works, try original text again
            speechSynthesis.speak(utter);
          };
          speechSynthesis.speak(simpleUtter);
        }
      }, 100);
    };

    // If voices are already loaded, speak immediately
    if (speechSynthesis.getVoices().length > 0) {
      speakWithVoices();
    } else {
      // Wait for voices to load
      const handleVoicesChanged = () => {
        speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        speakWithVoices();
      };
      speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
      
      // Fallback timeout in case voiceschanged doesn't fire
      setTimeout(() => {
        speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        speakWithVoices();
      }, 1000);
    }
  };

  const onSubmitAsk = async () => {
    if (!question.trim()) return;
    setSection("loading");
    
    try {
      const response = await fetch('/api/advisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, lang })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setResult(result);
      setSection("result");
    } catch (error) {
      console.error('Failed to get advisory:', error);
      // Show server error message
      const serverErrorMessages: Record<string, {title: string, text: string, steps: string[]}> = {
        en: {
          title: "🔧 Service Temporarily Unavailable",
          text: "We're sorry, but our agricultural advisory service is currently experiencing technical difficulties. Our servers are temporarily down for maintenance or experiencing high traffic. Please try again in a few minutes. If the problem persists, please check back later.",
          steps: [
            "Wait for 2-3 minutes and try your question again",
            "Check your internet connection", 
            "Try refreshing the page",
            "If the issue continues, please visit us again later"
          ]
        },
        hi: {
          title: "🔧 सेवा अस्थायी रूप से अनुपलब्ध",
          text: "हमें खुशी है कि आप हमारी कृषि सलाह सेवा का उपयोग कर रहे हैं, लेकिन अभी हमारे सर्वर में तकनीकी समस्या है। कृपया कुछ मिनट बाद फिर से कोशिश करें। यदि समस्या बनी रहे तो बाद में आएं।",
          steps: [
            "2-3 मिनट प्रतीक्षा करें और फिर से प्रयास करें",
            "अपना इंटरनेट कनेक्शन जांचें",
            "पेज को रिफ्रेश करने की कोशिश करें", 
            "यदि समस्या जारी रहे तो कृपया बाद में आएं"
          ]
        },
        ml: {
          title: "🔧 സേവനം താത്കാലികമായി ലഭ്യമല്ല",
          text: "ക്ഷമിക്കണം, ഞങ്ങളുടെ കാർഷിക സേവനത്തിൽ ഇപ്പോൾ സാങ്കേതിക പ്രശ്‌നമുണ്ട്. ദയവായി കുറച്ച് മിനിറ്റുകൾക്ക് ശേഷം വീണ്ടും ശ്രമിക്കുക. പ്രശ്‌നം തുടരുകയാണെങ്കിൽ പിന്നീട് വരുക.",
          steps: [
            "2-3 മിനിറ്റ് കാത്തിരുന്ന് വീണ്ടും ശ്രമിക്കുക",
            "നിങ്ങളുടെ ഇന്റർനെറ്റ് കണക്ഷൻ പരിശോധിക്കുക",
            "പേജ് പുതുക്കാൻ ശ്രമിക്കുക",
            "പ്രശ്‌നം തുടർന്നാൽ പിന്നീട് വരിക"
          ]
        }
      };
      
      const errorMsg = serverErrorMessages[lang] || serverErrorMessages.en;
      setResult({
        title: errorMsg.title,
        text: errorMsg.text,
        steps: errorMsg.steps,
        lang: lang
      });
      setSection("result");
    }
  };

  const onSubmitImage = async () => {
    if (!image) return;
    setSection("loading");
    
    try {
      const response = await fetch('/api/advisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: question || t("uploadImage"), 
          imageBase64: image, 
          lang 
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setResult(result);
      setSection("result");
    } catch (error) {
      console.error('Failed to get advisory:', error);
      // Show server error message  
      const serverErrorMessages: Record<string, {title: string, text: string, steps: string[]}> = {
        en: {
          title: "🔧 Service Temporarily Unavailable",
          text: "We're sorry, but our agricultural advisory service is currently experiencing technical difficulties. Our servers are temporarily down for maintenance or experiencing high traffic. Please try again in a few minutes. If the problem persists, please check back later.",
          steps: [
            "Wait for 2-3 minutes and try your question again",
            "Check your internet connection", 
            "Try refreshing the page",
            "If the issue continues, please visit us again later"
          ]
        },
        hi: {
          title: "🔧 सेवा अस्थायी रूप से अनुपलब्ध",
          text: "हमें खुशी है कि आप हमारी कृषि सलाह सेवा का उपयोग कर रहे हैं, लेकिन अभी हमारे सर्वर में तकनीकी समस्या है। कृपया कुछ मिनट बाद फिर से कोशिश करें। यदि समस्या बनी रहे तो बाद में आएं।",
          steps: [
            "2-3 मिनट प्रतीक्षा करें और फिर से प्रयास करें",
            "अपना इंटरनेट कनेक्शन जांचें",
            "पेज को रिफ्रेश करने की कोशिश करें", 
            "यदि समस्या जारी रहे तो कृपया बाद में आएं"
          ]
        },
        ml: {
          title: "🔧 സേവനം താത്കാലികമായി ലഭ്യമല്ല",
          text: "ക്ഷമിക്കണം, ഞങ്ങളുടെ കാർഷിക സേവനത്തിൽ ഇപ്പോൾ സാങ്കേതിക പ്രശ്‌നമുണ്ട്. ദയവായി കുറച്ച് മിനിറ്റുകൾക്ക് ശേഷം വീണ്ടും ശ്രമിക്കുക. പ്രശ്‌നം തുടരുകയാണെങ്കിൽ പിന്നീട് വരുക.",
          steps: [
            "2-3 മിനിറ്റ് കാത്തിരുന്ന് വീണ്ടും ശ്രമിക്കുക",
            "നിങ്ങളുടെ ഇന്റർനെറ്റ് കണക്ഷൻ പരിശോധിക്കുക",
            "പേജ് പുതുക്കാൻ ശ്രമിക്കുക",
            "പ്രശ്‌നം തുടർന്നാൽ പിന്നീട് വരിക"
          ]
        }
      };
      
      const errorMsg = serverErrorMessages[lang] || serverErrorMessages.en;
      setResult({
        title: errorMsg.title,
        text: errorMsg.text,
        steps: errorMsg.steps,
        lang: lang
      });
      setSection("result");
    }
  };

  const printGuide = () => {
    const el = advisoryRef.current;
    if (!el) return;
    const original = document.body.innerHTML;
    document.body.innerHTML = el.outerHTML;
    window.print();
    document.body.innerHTML = original;
    window.location.reload();
  };

  const shareAdvice = async () => {
    if (!result) return;
    
    const shareData = {
      title: `${result.title} - Krushi Sathi`,
      text: `${result.text}\n\nSteps:\n${result.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}`,
      url: window.location.origin
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Error sharing:', error);
        fallbackShare(shareData);
      }
    } else {
      fallbackShare(shareData);
    }
  };

  const fallbackShare = (shareData: { title: string; text: string; url: string }) => {
    if (navigator.clipboard) {
      const textToShare = `${shareData.title}\n\n${shareData.text}\n\nGet more advice at: ${shareData.url}`;
      navigator.clipboard.writeText(textToShare).then(() => {
        alert(t('copiedToClipboard') || 'Copied to clipboard!');
      });
    }
  };

  return (
    <Layout>
      {firstVisit && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-card text-card-foreground shadow-xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <Languages className="text-brand-leaf" />
              <h2 className="font-bold text-xl">{t("chooseLanguage")}</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              {t("welcome")} – {t("enableAlerts")}.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { code: "ml", label: "മലയാളം" },
                { code: "en", label: "English" },
                { code: "hi", label: "हिंदी" },
                { code: "mr", label: "मराठी" },
                { code: "kn", label: "ಕನ್ನಡ" },
                { code: "gu", label: "ગુજરાતી" },
                { code: "te", label: "తెలుగు" },
              ].map((opt) => (
                <Button key={opt.code} className="h-14 text-base" variant={opt.code === "ml" ? "default" : "secondary"} onClick={() => setLang(opt.code as any)}>
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        <Hero />
        <section>
          <h2 className="text-lg font-semibold mb-3 text-foreground/90">{t("mainMenu")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <CardAction
              icon={<Mic className="h-8 w-8" />}
              title={t("askQuestion")}
              onClick={() => setSection("ask")}
              className="from-brand-leaf/10 to-brand-leaf/5"
            />
            <CardAction
              icon={<ImageIcon className="h-8 w-8" />}
              title={t("uploadImage")}
              onClick={() => setSection("image")}
              className="from-brand-sun/20 to-brand-sun/10"
            />
            <CardAction
              icon={<CloudSun className="h-8 w-8" />}
              title={t("checkUpdates")}
              onClick={() => setSection("updates")}
              className="from-brand-sky/60 to-brand-sky/30"
            />
          </div>
        </section>

        {section === "ask" && (
          <section className="rounded-xl border bg-card p-4 md:p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Sprout className="text-brand-leaf" /> {t("askQuestion")}</h3>
            <div className="flex flex-col md:flex-row gap-3 md:items-end">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full min-h-24 md:min-h-14 rounded-lg border bg-background p-3 text-lg"
                placeholder={t("typeQuestion")}
              />
              <div className="flex gap-2">
                <Button onClick={listening ? stopListening : startListening} variant={listening ? "secondary" : "default"} className="md:h-12">
                  {listening ? <AudioLines /> : <Mic />} {listening ? t("stop") : t("speak")}
                </Button>
                <Button onClick={onSubmitAsk} className="md:h-12">
                  <ChevronRight /> {t("submit")}
                </Button>
              </div>
            </div>
          </section>
        )}

        {section === "image" && (
          <section className="rounded-xl border bg-card p-4 md:p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><ImageIcon className="text-brand-sun" /> {t("uploadImage")}</h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      
                      // Validate file
                      if (!isImageFile(f)) {
                        alert(t('invalidImageFile') || 'Please select a valid image file');
                        return;
                      }
                      
                      if (!validateImageSize(f, 10)) {
                        alert(t('imageTooLarge') || 'Image is too large. Please select an image smaller than 10MB');
                        return;
                      }
                      
                      try {
                        // Compress image before setting
                        const compressedImage = await compressImage(f, 2);
                        setImage(compressedImage);
                      } catch (error) {
                        console.error('Image compression failed:', error);
                        // Fallback to original file
                        const reader = new FileReader();
                        reader.onload = () => setImage(reader.result as string);
                        reader.readAsDataURL(f);
                      }
                    }}
                  />
                  <div className="rounded-lg border-2 border-dashed p-6 bg-background hover:bg-accent text-center">
                    <ImageIcon className="mx-auto mb-2" />
                    <div className="text-sm text-muted-foreground">{t("takePhoto")}</div>
                  </div>
                </label>
                {image && (
                  <img src={image} alt="preview" className="h-28 w-28 object-cover rounded-lg border" />
                )}
                <div className="ml-auto flex gap-2">
                  <Button variant="secondary" onClick={() => { setImage(null); setQuestion(""); }}>
                    <RefreshCw />
                  </Button>
                  <Button onClick={onSubmitImage}>
                    <ChevronRight /> {t("submit")}
                  </Button>
                </div>
              </div>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full min-h-20 rounded-lg border bg-background p-3 text-lg"
                placeholder={t("typeQuestion")}
              />
            </div>
          </section>
        )}

        {section === "updates" && <UpdatesSection location={location} />}

        {section === "loading" && (
          <section className="rounded-xl border bg-card p-4 md:p-6">
            <LoadingSeed label={t("processing")} />
          </section>
        )}

        {section === "result" && result && (
          <section ref={advisoryRef} className="rounded-xl border bg-card p-4 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-xl mb-2">{result.title}</h3>
                <div 
                  className="text-foreground/90 mb-3 text-lg leading-relaxed"
                  style={{ lineHeight: '1.6' }}
                  dangerouslySetInnerHTML={{ 
                    __html: result.text
                      // Convert **text:** to headers with inline styles
                      .replace(/\*\*([^*:]+):\*\*/g, '<h4 style="font-weight: bold; font-size: 1.125rem; margin-top: 1rem; margin-bottom: 0.5rem; color: inherit;">$1:</h4>')
                      // Convert **bold** to strong with inline styles  
                      .replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight: bold; color: inherit;">$1</strong>')
                      // Convert *italic* to em
                      .replace(/\*([^*]+)\*/g, '<em style="font-style: italic; color: inherit;">$1</em>')
                      // Convert bullet points with inline flex styles
                      .replace(/^[\s]*[•\-\*]\s(.+)$/gm, '<div style="display: flex; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.25rem;"><span style="color: inherit; margin-top: 0.125rem;">•</span><span style="color: inherit; flex: 1;">$1</span></div>')
                      // Convert numbered lists
                      .replace(/^[\s]*(\d+)\.\s(.+)$/gm, '<div style="display: flex; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.25rem;"><span style="font-weight: 600; color: inherit;">$1.</span><span style="color: inherit; flex: 1;">$2</span></div>')
                      // Convert line breaks
                      .replace(/\n/g, '<br />')
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={speaking ? "destructive" : "secondary"} 
                  onClick={() => speak(result.text)} 
                  aria-label={speaking ? t("stop") : t("listen")}
                  className={speaking ? "animate-pulse" : ""}
                >
                  <Volume2 /> {speaking ? t("stop") : t("listen")}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const voices = speechSynthesis.getVoices();
                    console.log('=== VOICE DEBUG INFO ===');
                    console.log('Selected language:', lang);
                    console.log('Total voices available:', voices.length);
                    
                    // Group voices by language
                    const voicesByLang = voices.reduce((acc, voice) => {
                      const langCode = voice.lang.substring(0, 2);
                      if (!acc[langCode]) acc[langCode] = [];
                      acc[langCode].push(voice);
                      return acc;
                    }, {} as Record<string, any[]>);
                    
                    console.log('Voices by language:', voicesByLang);
                    
                    // Test with current language
                    const speechMap: Record<string, string> = {
                      en: "en-US", ml: "ml-IN", hi: "hi-IN", mr: "mr-IN", 
                      kn: "kn-IN", gu: "gu-IN", te: "te-IN"
                    };
                    
                    const targetLang = speechMap[lang] || "en-US";
                    const testText = {
                      'en': 'Hello, this is a test',
                      'hi': 'नमस्ते, यह एक परीक्षण है',
                      'ml': 'ഹലോ, ഇത് ഒരു ടെസ്റ്റ് ആണ്',
                      'mr': 'नमस्कार, ही एक चाचणी आहे',
                      'kn': 'ನಮಸ್ಕಾರ, ಇದು ಒಂದು ಪರೀಕ್ಷೆ',
                      'gu': 'નમસ્તે, આ એક ટેસ્ટ છે',
                      'te': 'హలో, ఇది ఒక పరీక్ష'
                    };
                    
                    const testUtter = new SpeechSynthesisUtterance(testText[lang as keyof typeof testText] || testText['en']);
                    testUtter.lang = targetLang;
                    testUtter.rate = 0.8;
                    testUtter.volume = 1;
                    
                    // Find appropriate voice
                    let voice = voices.find(v => v.lang === targetLang) ||
                               voices.find(v => v.lang.startsWith(lang)) ||
                               voices.find(v => v.name.toLowerCase().includes(lang));
                    
                    if (voice) {
                      testUtter.voice = voice;
                      console.log('Testing with voice:', voice.name, voice.lang);
                    } else {
                      console.log('No specific voice found for', lang, 'using default');
                    }
                    
                    testUtter.onstart = () => console.log("✅ Test audio started");
                    testUtter.onend = () => console.log("✅ Test audio completed");
                    testUtter.onerror = (e) => console.error("❌ Test audio error:", e);
                    
                    speechSynthesis.speak(testUtter);
                  }}
                  title="Test voice for current language"
                >
                  🎤 Test Voice
                </Button>
              </div>
            </div>
            <ol className="list-decimal pl-5 space-y-2 text-foreground/90">
              {result.steps.map((s, i) => (
                <li 
                  key={i} 
                  className="text-foreground"
                  dangerouslySetInnerHTML={{
                    __html: s
                      // Convert **bold** to strong with inline styles
                      .replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight: bold; color: inherit;">$1</strong>')
                      // Convert *italic* to em
                      .replace(/\*([^*]+)\*/g, '<em style="font-style: italic; color: inherit;">$1</em>')
                  }}
                />
              ))}
            </ol>
            <div className="flex flex-wrap gap-2 mt-4">
              <Button onClick={() => setSaved((prev) => [result, ...prev])}>
                <Save /> {t("saveAdvice")}
              </Button>
              <Button variant="secondary" onClick={printGuide}>
                <Download /> {t("getGuide")}
              </Button>
              <Button variant="outline" onClick={shareAdvice}>
                <Share2 /> {t("share") || "Share"}
              </Button>
              <Button variant="outline" onClick={() => { setSection("menu"); setQuestion(""); setImage(null); }}>
                <Mic /> {t("askAnother")}
              </Button>
            </div>
            <div className="mt-6">
              <div className="text-sm text-muted-foreground mb-2">{t("helpful")}</div>
              <div className="flex gap-2">
                <FeedbackButton emoji="👍" label="Helpful" />
                <FeedbackButton emoji="👎" label="Not helpful" />
                <FeedbackButton emoji="❤️" label="Love it" />
                <FeedbackButton emoji="🌱" label="Very useful" />
              </div>
            </div>
          </section>
        )}

        {saved.length > 0 && (
          <section className="rounded-xl border bg-card p-4 md:p-6">
            <div className="flex items-center gap-2 mb-3">
              <Save className="text-brand-leaf" />
              <h3 className="font-semibold">Bookmarks</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {saved.map((s, i) => (
                <article key={i} className="rounded-lg border p-3 bg-background">
                  <div className="font-medium mb-1">{s.title}</div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{s.text}</p>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}

function Hero() {
  const { t } = useLocale();
  return (
    <section className="rounded-2xl border bg-gradient-to-br from-brand-sky/80 via-background to-background p-6 md:p-10 overflow-hidden relative">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-sun/40 blur-2xl" />
      <div className="absolute -left-10 -bottom-10 h-52 w-52 rounded-full bg-brand-leaf/20 blur-2xl" />
      <div className="relative z-10 grid md:grid-cols-2 gap-6 items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
            {t("appName")} – {" "}
            <span className="text-brand-leaf">AI</span> {" • "}
            <span className="text-brand-sun">Voice</span> {" • "}
            <span className="text-brand-leaf">Images</span>
          </h1>
          <p className="text-lg text-foreground/80 max-w-prose">
            {t("welcome")}! {t("enableAlerts")}
          </p>
        </div>
        <div className="flex md:justify-end">
          <div className="rounded-xl bg-card border shadow-inner px-4 py-3 flex items-center gap-3">
            <Sprout className="text-brand-leaf" />
            <span className="text-sm text-muted-foreground">{t("offline")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function CardAction({ icon, title, onClick, className }: { icon: React.ReactNode; title: string; onClick: () => void; className?: string; }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group rounded-xl border bg-gradient-to-b p-5 text-left transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-leaf",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div className="rounded-lg bg-background p-3 text-brand-leaf shadow-sm group-hover:scale-105 transition">
          {icon}
        </div>
        <div>
          <div className="font-bold text-lg">{title}</div>
          <div className="text-sm text-muted-foreground">Tap to continue</div>
        </div>
      </div>
    </button>
  );
}

function UpdatesSection({ location }: { location: {lat: number, lon: number} | null }) {
  const { t } = useLocale();
  const [enabled, setEnabled] = useState<boolean>(false);
  const [updates, setUpdates] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const url = location 
          ? `/api/updates?lat=${location.lat}&lon=${location.lon}`
          : '/api/updates';
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setUpdates(data);
        }
      } catch (error) {
        console.error('Failed to fetch updates:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUpdates();
  }, [location]);

  const requestPermission = async () => {
    try {
      const perm = await Notification.requestPermission();
      setEnabled(perm === "granted");
      if (perm === "granted") {
        new Notification(`${t("notifications")}`, { body: `${t("weather")} • ${t("marketPrices")} • ${t("govtSchemes")}` });
      }
    } catch {
      setEnabled(false);
    }
  };

  if (loading) {
    return (
      <section className="rounded-xl border bg-card p-4 md:p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><CloudSun className="text-brand-sun" /> {t("checkUpdates")}</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="animate-pulse bg-muted rounded-lg h-20"></div>
          <div className="animate-pulse bg-muted rounded-lg h-20"></div>
          <div className="animate-pulse bg-muted rounded-lg h-20"></div>
        </div>
      </section>
    );
  }

  const weatherLines = updates ? [
    `${updates.weather.temperatureC}°C • ${updates.weather.description}`,
    updates.weather.windKph ? `Wind: ${updates.weather.windKph} km/h` : "Live weather data"
  ] : ["Weather unavailable"];

  const marketLines = updates ? updates.market.map((item: any) => 
    `${item.crop}: ₹${item.pricePerKgInr}/kg`
  ) : ["Market data unavailable"];

  const schemeLines = updates ? updates.schemes.map((scheme: any) => 
    `${scheme.title}: ${scheme.status}`
  ) : ["Scheme data unavailable"];

  return (
    <section className="rounded-xl border bg-card p-4 md:p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2"><CloudSun className="text-brand-sun" /> {t("checkUpdates")}</h3>
      <div className="grid sm:grid-cols-3 gap-4">
        <UpdateCard title={t("weather")} icon={<CloudSun />} lines={weatherLines} />
        <UpdateCard title={t("marketPrices")} icon={<CheckCircle2 />} lines={marketLines} />
        <UpdateCard title={t("govtSchemes")} icon={<BookOpen />} lines={schemeLines} />
      </div>
      <div className="mt-4 flex items-center justify-between rounded-lg border p-3">
        <div>
          <div className="font-medium">{t("notifications")}</div>
          <div className="text-sm text-muted-foreground">{t("enableAlerts")}</div>
        </div>
        <Button onClick={requestPermission} variant={enabled ? "secondary" : "default"}>
          <BellDot /> {enabled ? "On" : "Enable"}
        </Button>
      </div>
    </section>
  );
}

function UpdateCard({ title, icon, lines }: { title: string; icon: React.ReactNode; lines: string[] }) {
  return (
    <article className="rounded-xl border bg-background p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-brand-leaf">{icon}</span>
        <h4 className="font-semibold">{title}</h4>
      </div>
      <ul className="text-sm text-foreground/80 space-y-1">
        {lines.map((l, i) => (
          <li key={i} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand-leaf" />{l}</li>
        ))}
      </ul>
    </article>
  );
}

function BadgePill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-sm">
      {label}
    </span>
  );
}

function FeedbackButton({ emoji, label }: { emoji: string; label: string }) {
  const [clicked, setClicked] = useState(false);
  
  const handleClick = () => {
    setClicked(true);
    // Track feedback (could send to analytics in production)
    console.log(`Feedback: ${label} - ${emoji}`);
    
    // Reset after animation
    setTimeout(() => setClicked(false), 2000);
  };

  return (
    <button
      onClick={handleClick}
      disabled={clicked}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-all",
        clicked 
          ? "bg-brand-leaf text-white border-brand-leaf scale-110" 
          : "bg-background hover:bg-accent hover:scale-105"
      )}
    >
      {emoji} {clicked ? "Thanks!" : label}
    </button>
  );
}

function makeAdvisory(q: string, img: string | null, lang: string): AdvisoryResult {
  const titles: Record<string, string> = {
    en: "Crop Advisory",
    ml: "കൃഷി നിർദ്ദേശം",
    hi: "कृषि सलाह",
    mr: "पिक सल्ला",
    kn: "ಬೆಳೆ ಸಲಹೆ",
    gu: "પાક સલાહ",
    te: "పంట సలహా",
  };
  const stepsMap: Record<string, string[]> = {
    en: ["Inspect leaves", "Isolate affected area", "Apply organic pesticide", "Control irrigation"],
    ml: ["ഇലകൾ പരിശോധിക്കുക", "ബാധിത ഭാഗം വേർതിരിക്കുക", "ജൈവ കീടനാശിനി പ്രയോഗിക്കുക", "വെള്ളം നിയന്ത്രിക്കുക"],
    hi: ["पत्तों की जाँच करें", "संक्रमित भाग अलग करें", "जैविक कीटनाशक लगाएँ", "सिंचाई नियंत्रित करें"],
    mr: ["पाने तपासा", "संक्रमित भाग वेगळा करा", "सेंद्रिय कीटकनाशक वापरा", "पाणी नियंत्रित करा"],
    kn: ["ಎಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ", "ಪೀಡಿತ ಭಾಗವನ್ನು ಬೇರ್ಪಡಿಸಿ", "ಸೇಂದ್ರೀಯ ಕೀಟನಾಶಕ ಬಳಸಿ", "ನೀರಾವರ��� ನಿಯಂತ್ರಿಸಿ"],
    gu: ["પાંદડા તપાસો", "સંક્રમિત ભાગ અલગ કરો", "સજીવ કીટનાશક લગાવો", "સિંચાઈ નિયંત્રિત કરો"],
    te: ["ఆకులను పరిశీలించండి", "బాధిత భాగాన్ని వేరుచేయండి", "సేంద్రీయ పురుగుమందు వాడండి", "పారుదల నియంత్రించండి"],
  };
  const promptPrefix: Record<string, string> = {
    en: "Question:",
    ml: "ചോദ്യം:",
    hi: "प्रश्न:",
    mr: "प्रश्न:",
    kn: "ಪ್ರಶ್ನೆ:",
    gu: "પ્રશ્ન:",
    te: "ప్రశ్న:",
  };
  const intro: Record<string, string> = {
    en: "Here are personalized steps for your crop.",
    ml: "നിങ്ങളുടെ വിളയ്ക്ക് ആവശ്യമായ സഹായ നിർദ്ദേശങ്ങൾ താഴെ നൽകിയിരിക്കുന്നു.",
    hi: "आपकी फसल के लिए आवश्यक सलाह नीचे दी गई है।",
    mr: "तुमच्या पिकासाठी आ���श्यक पायऱ्या खाली दिलेल्या आहेत.",
    kn: "ನಿಮ್ಮ ಬೆಳೆಗಾಗಿ ವೈಯಕ್ತಿಕ ಹಂತಗಳು ಕೆಳಗೆ ನೀಡಲಾಗಿದೆ.",
    gu: "તમારી પાક માટે વ્યક્તિગત પગલાં નીચે આપેલ છે.",
    te: "మీ పంట కోసం సూచనలు క్రింద ఉన్నాయి.",
  };
  const title = titles[lang] || titles.en;
  const steps = stepsMap[lang] || stepsMap.en;
  const text = `${q ? `${promptPrefix[lang] || promptPrefix.en} ${q}. ` : ""}${intro[lang] || intro.en}`;

  return { title, text, steps, lang };
}

function BellDot() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-brand-sun">
      <path d="M12 2a7 7 0 0 0-7 7v3.586l-1.707 1.707A1 1 0 0 0 4 16h16a1 1 0 0 0 .707-1.707L19 12.586V9a7 7 0 0 0-7-7zm0 20a3 3 0 0 0 3-3H9a3 3 0 0 0 3 3z" />
    </svg>
  );
}
