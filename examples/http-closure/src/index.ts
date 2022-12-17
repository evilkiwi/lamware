import { setup } from './common';

const { handler } = setup().execute(async ({ state }) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      test: state.config.hello,
    }),
  };
});

export { handler };
