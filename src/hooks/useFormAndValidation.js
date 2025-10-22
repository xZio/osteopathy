import { useState, useCallback, useRef } from "react";

export function useFormAndValidation() {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isValid, setIsValid] = useState(false);
  const formRef = useRef(null);

  // Базовая функция валидации для разных типов полей
  const validateField = (
    name,
    value,
    type = "text",
    isFieldTouched = false
  ) => {
    // Не показываем ошибку, пока поле не трогали
    if (!isFieldTouched) return "";

    const v = (value ?? "").toString();

    if (type === "phone") {
      // Если поле пустое или содержит только маску с подчеркиваниями, это нормально до взаимодействия
      if (v.trim() === "" || v === "+7 (___) ___-__-__") return "";
      if (v.includes("_")) return "Введите номер телефона";
      const phoneRegex = /^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/;
      return phoneRegex.test(v) ? "" : "Введите корректный номер телефона";
    }

    if (type === "date") {
      // Если поле пустое или содержит только маску с подчеркиваниями, это нормально до взаимодействия
      if (v.trim() === "" || v === "__.__.____") return "";
      if (v.includes("_")) return "Выберите дату";

      // Проверяем формат DD.MM.YYYY
      const dateRegex =
        /^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[0-2])\.(19|20)\d\d$/;
      if (!dateRegex.test(v)) return "Введите корректную дату";

      // Проверяем, что дата не в прошлом
      const [day, month, year] = v.split(".");
      const selectedDate = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        return "Дата не может быть в прошлом";
      }

      return "";
    }

    if (type === "time") {
      return v ? "" : "Выберите время";
    }

    if (type === "name") {
      const trimmed = v.trim();
      if (trimmed.length === 0) return "Поле обязательно";
      if (trimmed.length < 2) return "Имя должно содержать минимум 2 символа";
      if (!/^[а-яёА-ЯЁa-zA-Z\s-]+$/.test(trimmed))
        return "Имя может содержать только буквы, пробелы и дефисы";
      return "";
    }

    // По умолчанию — просто проверка на пустоту
    return v.trim() === "" ? "Поле обязательно" : "";
  };

  const inferTypeByName = (name) => {
    if (name === "phone") return "phone";
    if (name === "date") return "date";
    if (name === "time") return "time";
    if (name === "name") return "name";
    if (name === "email") return "email";
    return "text";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newValues = { ...values, [name]: value };
    setValues(newValues);
    setTouched((prev) => ({ ...prev, [name]: true }));
    const fieldType = inferTypeByName(name);
    const error = validateField(name, value, fieldType, true);
    setErrors((prev) => ({ ...prev, [name]: error }));

    // Проверяем валидность с новыми значениями
    const valid = checkFormValidityWithValues(newValues);

    setIsValid(valid);
  };

  // onAccept для IMaskInput (телефон/дата)
  const handleAccept = (value, data) => {
    const name = data?.el?.input?.name;
    if (!name) return;
    const newValues = { ...values, [name]: value };
    setValues(newValues);
    setTouched((prev) => ({ ...prev, [name]: true }));
    const fieldType = inferTypeByName(name);
    const error = validateField(name, value, fieldType, true);
    setErrors((prev) => ({ ...prev, [name]: error }));

    // Проверяем валидность с новыми значениями
    const valid = checkFormValidityWithValues(newValues);
    setIsValid(valid);
  };

  const validateForm = useCallback(() => {
    const nextTouched = { ...touched };
    const nextErrors = { ...errors };

    // Список обязательных полей для проверки
    const requiredFields = ["name", "phone", "date", "time"];

    requiredFields.forEach((name) => {
      nextTouched[name] = true;
      const fieldType = inferTypeByName(name);
      const value = values[name] ?? "";

      // Проверяем, что поле заполнено
      if (value.toString().trim() === "") {
        nextErrors[name] =
          fieldType === "time"
            ? "Выберите время"
            : "Поле обязательно для заполнения";
      } else {
        // Проверяем маскированные поля на подчеркивания
        if (fieldType === "phone" && value.toString().includes("_")) {
          nextErrors[name] = "Введите номер телефона";
        } else if (fieldType === "date" && value.toString().includes("_")) {
          nextErrors[name] = "Выберите дату";
        } else {
          // Проверяем валидность поля
          const fieldError = validateField(name, value, fieldType, true);
          nextErrors[name] = fieldError;
        }
      }
    });

    setTouched(nextTouched);
    setErrors(nextErrors);
    const ok = Object.values(nextErrors).every((e) => e === "");
    setIsValid(ok);
    return ok;
  }, [values, errors, touched]);

  const checkFormValidityWithValues = useCallback((valuesToCheck) => {
    if (!valuesToCheck) return false;

    // Список обязательных полей для проверки
    const requiredFields = ["name", "phone", "date", "time"];

    for (const fieldName of requiredFields) {
      const value = valuesToCheck[fieldName] ?? "";
      const fieldType = inferTypeByName(fieldName);

      // Проверяем, что поле не пустое
      if (value.toString().trim() === "") {
        return false;
      }

      // Проверяем маскированные поля на подчеркивания
      if (fieldType === "phone" && value.toString().includes("_")) {
        return false;
      }
      if (fieldType === "date" && value.toString().includes("_")) {
        return false;
      }

      // Проверяем валидность поля
      const error = validateField(fieldName, value, fieldType, true);
      if (error) {
        return false;
      }
    }

    return true;
  }, []);

  const resetForm = useCallback(() => {
    setValues({});
    setErrors({});
    setTouched({});
    setIsValid(false);
    if (formRef.current) formRef.current.reset();
  }, []);

  return {
    values,
    errors,
    touched,
    isValid,
    handleChange,
    handleAccept,
    validateForm,
    resetForm,
    setValues,
    setIsValid,
    formRef,
  };
}
