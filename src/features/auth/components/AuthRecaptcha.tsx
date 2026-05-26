import React, { forwardRef, memo, useCallback } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

export type AuthRecaptchaProps = {
  siteKey: string;
  onTokenChange: (token: string | null) => void;
};

/**
 * Isolated reCAPTCHA widget so login/register form state updates do not remount it
 * (remounting resets image challenges and drops tile selections).
 */
const AuthRecaptchaInner = forwardRef<ReCAPTCHA, AuthRecaptchaProps>(
  function AuthRecaptcha({ siteKey, onTokenChange }, ref) {
    const handleChange = useCallback(
      (token: string | null) => {
        onTokenChange(token);
      },
      [onTokenChange],
    );

    const handleExpired = useCallback(() => {
      onTokenChange(null);
    }, [onTokenChange]);

    const handleErrored = useCallback(() => {
      onTokenChange('OFFLINE');
    }, [onTokenChange]);

    return (
      <div
        className="flex min-h-[78px] w-full items-center justify-center"
        style={{ contain: 'layout' }}
      >
        <ReCAPTCHA
          ref={ref}
          sitekey={siteKey}
          onChange={handleChange}
          onExpired={handleExpired}
          onErrored={handleErrored}
          theme="light"
        />
      </div>
    );
  },
);

export const AuthRecaptcha = memo(AuthRecaptchaInner);
