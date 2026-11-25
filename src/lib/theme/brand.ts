// Welcome copy is site-neutral; the selected real model keeps its own identity.
export const SITE_NAME = 'labfocus';
export const SITE_MARK = '/static/labfocus/brand-whale.png';
export const ASSISTANT_MARK = SITE_MARK;

// Keep uploaded avatars on the existing authenticated image endpoint.
export function usesDefaultProfileImage(source?: string | null, userId?: string | null): boolean {
	return (
		!source ||
		['/user.png', '/static/user.png', '/favicon.png', '/static/favicon.png'].includes(source) ||
		(Boolean(userId) && source === `/api/v1/users/${userId}/profile/image`)
	);
}

export function welcomeCopy(language: string) {
	const zh = (language ?? '').toLowerCase().startsWith('zh');
	return zh
		? {
				greeting: '今天，想聊些什么？',
				subtitle: '有什么可以帮你的吗？',
				input: '今天，想从哪里聊起？'
			}
		: {
				greeting: 'What would you like to chat about today?',
				subtitle: 'What can I help you with today?',
				input: 'Where would you like to start?'
			};
}
