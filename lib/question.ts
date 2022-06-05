import inquirer from 'inquirer';

type ConfigItem<T, C> = {
  name: T;
  message: string;
  type: string;
  choices: { name: string; value: C }[];
};
function defineConfigs<T extends string, C extends string>(
  questions: ConfigItem<T, C>[],
) {
  return questions;
}

export const questions = async () => {
  const questions = defineConfigs([
    {
      name: 'frameworks',
      message: `check the framework needed for your project: `,
      type: 'list',
      choices: [
        {
          name: 'React',
          value: 'react',
        },
        {
          name: 'Vue',
          value: 'vue',
        },
      ],
    },
    {
      name: 'language',
      message: `check the language needed for your project: `,
      type: 'list',
      choices: [
        {
          name: 'typescript',
          value: 'ts',
        },
        {
          name: 'javascript',
          value: 'js',
        },
      ],
    },
  ]);

  type Keys = typeof questions[number]['name'];
  type Choice = typeof questions[number]['choices'][number]['value'];
  return await inquirer.prompt<{
    [key in Keys]: Choice;
  }>(questions);
};
