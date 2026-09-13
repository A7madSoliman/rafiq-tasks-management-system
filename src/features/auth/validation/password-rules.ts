export const passwordRules = {
  minLength: 8,
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  digit: /[0-9]/,
  specialCharacter: /[^A-Za-z0-9]/,
} as const;

export function getPasswordChecks(password: string) {
  return {
    minLength: password.length >= passwordRules.minLength,
    hasUpperLowerDigit:
      passwordRules.uppercase.test(password) &&
      passwordRules.lowercase.test(password) &&
      passwordRules.digit.test(password),
    hasSpecialCharacter: passwordRules.specialCharacter.test(password),
  };
}
