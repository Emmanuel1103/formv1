import React from 'react';
import './Radio.css';

const RadioGroup = ({
    label,
    name,
    options,
    value,
    onChange,
    error,
    required = false
}) => {
    return (
        <div className="radio-group-container">
            {label && (
                <label className="radio-group-label">
                    {label}{required && <span className="required">*</span>}
                </label>
            )}
            <div className="radio-options">
                {options.map((option) => {
                    const isSelected = value === option.value;
                    const optionValue = option.value || option;
                    const optionLabel = option.label || option;

                    return (
                        <label key={optionValue} className={`radio-option ${value === optionValue ? 'selected' : ''}`}>
                            <input
                                type="radio"
                                name={name}
                                value={optionValue}
                                checked={value === optionValue}
                                onChange={onChange}
                                className="radio-input"
                            />
                            <div className="radio-circle">
                                <div className="radio-inner" />
                            </div>
                            <span className="radio-option-label">{optionLabel}</span>
                        </label>
                    );
                })}
            </div>
            {error && <span className="error-message">{error}</span>}
        </div>
    );
};

export default RadioGroup;
