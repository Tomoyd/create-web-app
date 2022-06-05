export const language = () => {
  return {
    name: 'language',
    message: `check the language needed for your project: `,
    type: 'list',
    choice: [
      {
        name: 'typescript',
        value: 'ts',
      },
      {
        name: 'javascript',
        value: 'js',
      },
    ],
  };
};
