import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { MotionConfig } from "motion/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { router } from "./router";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <MotionConfig
        reducedMotion="user"
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        <TooltipProvider delayDuration={250}>
          <RouterProvider router={router} />
          <Toaster position="bottom-right" closeButton />
        </TooltipProvider>
      </MotionConfig>
    </ThemeProvider>
  </React.StrictMode>,
);
