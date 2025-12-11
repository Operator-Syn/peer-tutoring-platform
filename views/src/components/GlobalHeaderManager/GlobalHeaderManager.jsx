import icon from '../../assets/images/icon.png';

export default function GlobalHeaderManager() {
  return (
    <>
      <title>The Hootline</title>
      <meta name="description" content="The Hootline description." />
      <link rel="icon" href={icon} type="image/png" />
    </>
  );
}
