import React, { useState, useEffect } from 'react';

interface Rule<T extends object> {
  required?: boolean;
  equalToField?: keyof T;
}

interface Rules<T extends object> {
  [key: string]: Rule<T> | boolean;
}

interface Errors<T extends object> {
  required: Array<keyof T>;
  equalToField: Array<keyof T>;
}

type Form<T extends object> = {
  [key in keyof T]: string;
}

type SetFunctions<T extends object> = {
  [key in keyof T]: React.Dispatch<React.SetStateAction<string>>;
}

function getRequired<T extends Rules<T>>(rules: T): Array<keyof T & string> {
  return Object.keys(rules).filter(key => {
    const value = rules[key];
    return typeof value === 'boolean' ? value : value.required;
  });
}

function reduceFailedRequired<T extends Rules<T>>(keys: Array<keyof T & string>, form: Form<T>) {
  return keys.reduce((result: typeof keys, key) => {
    if (!!form[key] && (form[key].length !== 0)) return result;
    return [...result, key];
  }, []);
}

function getRule<T extends Rules<T>>(rule: keyof Rule<T> & string, rules: T): Array<keyof T & string> {
  return Object.keys(rules).filter(key => {
    const value = rules[key];
    return typeof value === 'boolean' ? false : value[rule];
  });
}

function reduceFailedRule<T extends Rules<T>>(rule: keyof Rule<T>, keys: Array<keyof T & string>, form: Form<T>, rules: T) {
  return keys.reduce((result: typeof keys, key) => {
    const value = rules[key] as Rule<T>;
    const formKey = value[rule] as keyof Form<T>;
    if (form[key] === form[formKey]) return result;
    return [...result, key];
  }, []);

}

function validateForm<T extends Rules<T>>(form: Form<T>, rules: T): Errors<T> {
  const failedRequired = reduceFailedRequired(getRequired(rules), form);
  const failedEqualToField = reduceFailedRule('equalToField', getRule('equalToField', rules), form, rules);
  return { required: failedRequired, equalToField: failedEqualToField };
}

export function useForm<T extends Rules<T>>(rules: T): [Form<T>, SetFunctions<Form<T>>, boolean, Errors<T>] {
  const [valid, setValid] = useState(false);
  const keys = Object.keys(rules);
  const [form, setForm] = useState(keys.reduce((result, key) => ({ ...result, [key]: '' }), {} as Form<T>))
  const errors = validateForm(form, rules);
  useEffect(
    () => {
      const validRequired = errors.required.length === 0;
      const validEqualToField = errors.equalToField.length === 0;
      setValid(validRequired && validEqualToField);
    },
    [errors],
  );
  const setters = keys.reduce(
    (result, key) => ({ ...result, [key]: (v: string) => setForm({ ...form, [key]: v }) }),
    {} as SetFunctions<Form<T>>,
  );
  return [form, setters, valid, errors];
}

