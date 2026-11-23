// DSH-THEME: neutral assistant identity used by the welcome screens.
// This is not the DeepSeek trademark; it is a generic placeholder mark.

export const ASSISTANT_NAME = 'DeepSeek';
export const ASSISTANT_MARK = '/static/assistant-mark.svg';

export function welcomeCopy(language: string) {
	const zh = (language ?? '').toLowerCase().startsWith('zh');

	return zh
		? {
				greeting: `我是 ${ASSISTANT_NAME}，很高兴见到你！`,
				subtitle: '有什么可以帮你的吗？'
			}
		: {
				greeting: `Hi, I'm ${ASSISTANT_NAME}. Nice to meet you!`,
				subtitle: 'What can I help you with today?'
			};
}
