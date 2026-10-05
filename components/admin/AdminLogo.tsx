/** Login-screen logo: the primary eyeball-and-wordmark logo. */
export function AdminLogo() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logos/zvc_logo_primary_rgb_color.png"
      alt="Zero Vision Cinema"
      width={360}
      height={302}
      style={{ width: 'min(360px, 80vw)', height: 'auto' }}
    />
  );
}
