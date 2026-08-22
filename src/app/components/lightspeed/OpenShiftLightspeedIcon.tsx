/** Official OpenShift Lightspeed mark from the console plugin (`logo.svg` / `logo-dark.svg`). */
export function OpenShiftLightspeedIcon({
  size = 32,
  className,
  title,
}: {
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <span className={className ? `ols-logo ${className}` : "ols-logo"} style={{ width: size, height: size }}>
      <img
        src="/lightspeed/logo.svg"
        alt=""
        width={size}
        height={size}
        className="ols-logo__img ols-logo__img--light"
      />
      <img
        src="/lightspeed/logo-dark.svg"
        alt=""
        width={size}
        height={size}
        className="ols-logo__img ols-logo__img--dark"
      />
      {title ? <span className="pf-v6-screen-reader">{title}</span> : null}
    </span>
  );
}
