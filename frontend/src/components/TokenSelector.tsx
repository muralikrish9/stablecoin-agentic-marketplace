/**
 * Token Selector Component
 */

import { useState } from 'react';

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chainId: number;
  logoURI?: string;
}

interface TokenSelectorProps {
  selectedToken: Token;
  onSelectToken: (token: Token) => void;
  availableTokens: Token[];
  label?: string;
}

export default function TokenSelector({ 
  selectedToken, 
  onSelectToken, 
  availableTokens,
  label = "Select Token"
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (token: Token) => {
    onSelectToken(token);
    setIsOpen(false);
  };

  return (
    <div className="token-selector-wrapper">
      <button 
        className="token-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <div className="token-display">
          {selectedToken.logoURI && (
            <img src={selectedToken.logoURI} alt={selectedToken.symbol} className="token-logo" />
          )}
          <div className="token-details">
            <span className="token-symbol">{selectedToken.symbol}</span>
            <span className="token-name">{selectedToken.name}</span>
          </div>
        </div>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <>
          <div className="token-selector-overlay" onClick={() => setIsOpen(false)} />
          <div className="token-selector-dropdown">
            <div className="dropdown-header">
              <h4>{label}</h4>
              <button onClick={() => setIsOpen(false)} className="close-button">×</button>
            </div>
            <div className="token-list">
              {availableTokens.map((token) => (
                <button
                  key={`${token.chainId}-${token.address}`}
                  className={`token-option ${selectedToken.address === token.address ? 'selected' : ''}`}
                  onClick={() => handleSelect(token)}
                  type="button"
                >
                  {token.logoURI && (
                    <img src={token.logoURI} alt={token.symbol} className="token-logo" />
                  )}
                  <div className="token-option-details">
                    <span className="token-option-symbol">{token.symbol}</span>
                    <span className="token-option-name">{token.name}</span>
                  </div>
                  {selectedToken.address === token.address && (
                    <span className="checkmark">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

