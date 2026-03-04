import React from 'react';
import './Checkbox.css';

const Checkbox = ({
    label,
    checked,
    onChange,
    name,
    error,
    disabled = false
}) => {
    return (
        <div className="checkbox-group">
            <label className={`checkbox-container ${disabled ? 'disabled' : ''}`}>
                <div className="checkbox-wrapper">
                    <input
                        type="checkbox"
                        name={name}
                        checked={checked}
                        onChange={onChange}
                        disabled={disabled}
                        className="checkbox-input"
                    />
                    <div className="checkbox-box">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                </div>
                {label && <span className="checkbox-label">{label}</span>}
            </label>
            {error && <span className="error-message">{error}</span>}
        </div>
    );
};

export default Checkbox;
