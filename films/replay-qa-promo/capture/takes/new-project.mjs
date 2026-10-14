// The hook: "point it at your app". Types a URL into New project and hovers Start setup (never submits).
export const meta = { url: 'https://qa.replay.io/' };
export default async function (page, h) {
  await h.wait(800);
  await h.mark('start');
  await h.wait(700);
  await h.click('[data-testid="chat-input-textarea"]');
  await h.mark('typing');
  await h.type('https://staging.your-app.dev', { cps: 13 });
  await h.mark('typed');
  await h.wait(600);
  await h.hover('text=Start setup', { dur: 700 });
  await h.mark('hover-start');
  await h.wait(1400);
  await h.mark('end');
}
