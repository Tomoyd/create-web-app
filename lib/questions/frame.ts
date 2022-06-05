export const frame = () => {
  return {
    name: 'frameworks',
    message: `check the framework needed for your project: `,
    type: 'list',
    choice: [
      {
        name: 'React',
        value: 'react',
      },
      {
        name: 'Vue',
        value: 'vue',
      },
    ],
  };
};
