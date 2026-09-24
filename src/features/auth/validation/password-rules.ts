export const passwordRules = {
  minLength: 8,
  maxLength: 64,
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  digit: /[0-9]/,
  specialCharacter: /[^A-Za-z0-9]/,
} as const;

export function getPasswordChecks(password: string) {
  const hasUppercase = passwordRules.uppercase.test(password);
  const hasLowercase = passwordRules.lowercase.test(password);
  const hasDigit = passwordRules.digit.test(password);

  return {
    validLength:
      password.length >= passwordRules.minLength && password.length <= passwordRules.maxLength,
    hasUppercase,
    hasLowercase,
    hasDigit,
    hasUpperLowerDigit: hasUppercase && hasLowercase && hasDigit,
    hasSpecialCharacter: passwordRules.specialCharacter.test(password),
  };
}
