"use client";
import React from "react";
import ReactDOM from "react-dom/client";
import OtpDialog from "./OtpDialog"

export function showOtpDialog({
  siteName,
  referer,
  operatorName,
}: {
  siteName: string;
  referer: string;
  operatorName: string;
}): Promise<string | null> {
  return new Promise((resolve) => {
    const div = document.createElement("div");
    document.body.appendChild(div);

    const root = ReactDOM.createRoot(div);

    const handleClose = (token: string | null) => {
      root.unmount();
      div.remove();
      resolve(token);
    };

    root.render(
      <OtpDialog
        open={true}
        siteName={siteName}
        referer={referer}
        operatorName={operatorName}
        onClose={handleClose}
      />
    );
  });
}
