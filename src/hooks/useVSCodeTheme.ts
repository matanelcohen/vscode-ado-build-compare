import { useState, useEffect } from 'react';

interface VsCodeApi {
  postMessage: (message: any) => void;
}

export function useVSCodeTheme(vscode: VsCodeApi): string {
  const [theme, setTheme] = useState<string>('vscode-dark');

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.command === 'themeChanged') {
        setTheme(message.theme);
      }
    };

    window.addEventListener('message', handleMessage);

    vscode.postMessage({ command: 'getTheme' });

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [vscode]);

  return theme;
}
