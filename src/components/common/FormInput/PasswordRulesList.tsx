import React from 'react';
import styles from './FormInput.module.scss';
import type { PasswordRule } from './FormInput';
import { defaultPasswordRules } from './FormInput';

export interface PasswordRulesListProps {
  value: string;
  rules?: PasswordRule[];
}

const PasswordRulesList: React.FC<PasswordRulesListProps> = ({
  value,
  rules = defaultPasswordRules,
}) => {
  const ruleResults = rules.map((r) => ({ ...r, met: r.test(value) }));

  return (
    <ul className={styles.passwordRules} aria-live="polite">
      {ruleResults.map(({ id: ruleId, label: ruleLabel, met }) => (
        <li
          key={ruleId}
          className={met ? styles.ruleMet : styles.ruleUnmet}
          aria-label={met ? `Cumple: ${ruleLabel}` : `Falta: ${ruleLabel}`}
        >
          <span className={styles.ruleIcon} aria-hidden>
            {met ? '✓' : '○'}
          </span>
          <span>{ruleLabel}</span>
        </li>
      ))}
    </ul>
  );
};

export default PasswordRulesList;
