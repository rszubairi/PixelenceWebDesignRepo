// components/ui/Form.js
import React, { useState } from 'react';
import Button from './Button';

const Form = ({ fields = [], onSubmit, submitText = 'Submit' }) => {
  const [values, setValues] = useState({});

  const handleChange = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(values);
  };

  const renderField = (field) => {
    const commonProps = {
      id: field.name,
      name: field.name,
      required: field.required,
      value: values[field.name] ?? '',
      onChange: (e) => handleChange(field.name, e.target.value),
      className: 'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm',
    };

    if (field.type === 'select') {
      return (
        <select {...commonProps}>
          <option value="">Select {field.label}</option>
          {(field.options || []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === 'textarea') {
      return <textarea rows={4} {...commonProps} />;
    }

    return <input type={field.type || 'text'} {...commonProps} />;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map((field) => (
        <div key={field.name}>
          <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
            {field.label}
          </label>
          {renderField(field)}
        </div>
      ))}
      <div className="flex justify-end pt-2">
        <Button type="submit">{submitText}</Button>
      </div>
    </form>
  );
};

export default Form;
