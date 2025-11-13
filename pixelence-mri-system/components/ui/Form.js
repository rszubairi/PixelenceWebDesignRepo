// components/ui/Form.js
import React, { useState } from 'react';

const Form = ({ fields, onSubmit, submitText = 'Submit', initialData = {} }) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    fields.forEach(field => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const renderField = (field) => {
    const { name, label, type, options, required } = field;
    const hasError = errors[name];
    
    switch (type) {
      case 'select':
        return (
          <div key={name} className="mb-4">
            <label htmlFor={name} className="form-label">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <select
              id={name}
              name={name}
              className={`form-input ${hasError ? 'border-red-500' : ''}`}
              value={formData[name] || ''}
              onChange={handleChange}
              required={required}
            >
              <option value="">Select an option</option>
              {options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {hasError && <p className="mt-1 text-sm text-red-500">{hasError}</p>}
          </div>
        );
      
      case 'textarea':
        return (
          <div key={name} className="mb-4">
            <label htmlFor={name} className="form-label">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              id={name}
              name={name}
              rows="4"
              className={`form-input ${hasError ? 'border-red-500' : ''}`}
              value={formData[name] || ''}
              onChange={handleChange}
              required={required}
            ></textarea>
            {hasError && <p className="mt-1 text-sm text-red-500">{hasError}</p>}
          </div>
        );
      
      case 'checkbox':
        return (
          <div key={name} className="mb-4">
            <div className="flex items-center">
              <input
                id={name}
                name={name}
                type="checkbox"
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                checked={formData[name] || false}
                onChange={handleChange}
              />
              <label htmlFor={name} className="ml-2 block text-sm text-gray-900">
                {label} {required && <span className="text-red-500">*</span>}
              </label>
            </div>
            {hasError && <p className="mt-1 text-sm text-red-500">{hasError}</p>}
          </div>
        );
      
      default:
        return (
          <div key={name} className="mb-4">
            <label htmlFor={name} className="form-label">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
              id={name}
              name={name}
              type={type}
              className={`form-input ${hasError ? 'border-red-500' : ''}`}
              value={formData[name] || ''}
              onChange={handleChange}
              required={required}
            />
            {hasError && <p className="mt-1 text-sm text-red-500">{hasError}</p>}
          </div>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {fields.map(renderField)}
      <div className="flex justify-end">
        <button
          type="submit"
          className="btn-primary"
        >
          {submitText}
        </button>
      </div>
    </form>
  );
};

export default Form;