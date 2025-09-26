import { FC } from 'react';

type ProviderSelectorProps = {
  provider: 'openai' | 'gemini';
  onProviderChange: (provider: 'openai' | 'gemini') => void;
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'error';
  onReconnect: () => void;
};

const ProviderSelector: FC<ProviderSelectorProps> = ({ 
  provider, 
  onProviderChange, 
  connectionState,
  onReconnect 
}) => {
  const handleProviderChange = (newProvider: 'openai' | 'gemini') => {
    if (newProvider !== provider) {
      onProviderChange(newProvider);
      if (connectionState === 'connected' || connectionState === 'error') {
        // Reconnect with new provider
        setTimeout(() => onReconnect(), 100);
      }
    }
  };

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-slate-400">AI Provider:</span>
      <div className="flex gap-2">
        <button
          onClick={() => handleProviderChange('openai')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            provider === 'openai'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          OpenAI
        </button>
        <button
          onClick={() => handleProviderChange('gemini')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            provider === 'gemini'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          Gemini
        </button>
      </div>
    </div>
  );
};

export default ProviderSelector;