export const createPkg = () => {
  const pkg = {
    name: '',
    version: '0.1.0',
    dependencies: {},
    devDependencies: {},
  };
  const getPkg = () => pkg;
  const extendsPkg = (config) => {
    Object.keys(config).forEach((k) => {
      if (Array.isArray(pkg[k])) {
        pkg[k] = [...pkg[k], ...config[k]];
        return;
      }
      if (typeof pkg[k] === 'string') {
        pkg[k] = config[k];
        return;
      }
      pkg[k] = { ...(pkg[k] || {}), ...config[k] };
    });
  };

  return {
    getPkg,
    extendsPkg,
  };
};
