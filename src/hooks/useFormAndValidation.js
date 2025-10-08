import { useState, useCallback, useRef } from "react";


export function useFormAndValidation() {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(true);
  const formRef = useRef(null); // Добавляем ref для формы

  // Удаляем все DOM-манипуляции, работаем только с состоянием
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value.replace(/\D/g, '');
    
    if (formattedValue.length > 8) formattedValue = formattedValue.slice(0, 8);
    if (formattedValue.length > 4) formattedValue = `${formattedValue.slice(0, 2)}.${formattedValue.slice(2, 4)}.${formattedValue.slice(4)}`;
    else if (formattedValue.length > 2) formattedValue = `${formattedValue.slice(0, 2)}.${formattedValue.slice(2)}`;

    setValues(prev => ({ ...prev, [name]: formattedValue }));
  };

 /*  const handlePhoneChange = (e) => {
    const { name, value } = e.target;
    const cleaned = value.replace(/\D/g, '');
    
    let formatted = '+7 (';
    if (cleaned.length > 1) {
      const rest = cleaned.slice(1);
      formatted += `${rest.slice(0, 3)}) ${rest.slice(3, 6)}-${rest.slice(6, 8)}-${rest.slice(8, 10)}`;
    }
    
    setValues(prev => ({ ...prev, [name]: formatted }));
  }; */

  const handleChange = (e) => {
    const { name, value, validity } = e.target;
    
    setValues(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: validity.valid ? '' : 'Ошибка ввода' }));
    setIsValid(formRef.current.checkValidity());
  };

  const resetForm = useCallback(() => {
    setValues({});
    setErrors({});
    setIsValid(false);
    if (formRef.current) formRef.current.reset();
  }, []);

  return {
    values,
    handleChange,
    handleDateChange,
    //handlePhoneChange,
    errors,
    isValid,
    resetForm,
    setValues,
    setIsValid,
    formRef // Добавляем formRef в возвращаемые значения
  };
}