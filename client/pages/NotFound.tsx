import Layout from "@/components/Layout";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold mb-2">404</h1>
          <p className="text-lg text-muted-foreground mb-6">Oops! Page not found</p>
          <Button asChild>
            <a href="/">Go Home</a>
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
