import { useState, useEffect } from 'react';

interface VsCodeApi {
  postMessage: (message: any) => void;
}

export function useVSCodeTheme(vscode: VsCodeApi): string {
  const [theme, setTheme] = useState<string>('vscode-dark'); // Default theme

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.command === 'themeChanged') {
        console.log("Theme changed:", message.theme);
        setTheme(message.theme);
      }
    };

    window.addEventListener('message', handleMessage);

    // Request initial theme
    vscode.postMessage({ command: 'getTheme' });

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [vscode]);

  return theme;
}
