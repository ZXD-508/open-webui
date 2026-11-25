import { describe, expect, it } from 'vitest';
import { usesDefaultProfileImage } from './brand';

describe('sidebar default profile image', () => {
	it('recognizes only the current user’s canonical default image', () => {
		expect(
			usesDefaultProfileImage('/api/v1/users/fixture-user/profile/image', 'fixture-user')
		).toBe(true);
		expect(usesDefaultProfileImage('/api/v1/users/other-user/profile/image', 'fixture-user')).toBe(
			false
		);
		expect(usesDefaultProfileImage('/api/v1/users/fixture-user/profile/image')).toBe(false);
		expect(
			usesDefaultProfileImage(
				'https://example.invalid/api/v1/users/fixture-user/profile/image',
				'fixture-user'
			)
		).toBe(false);
	});
	it.each([
		undefined,
		null,
		'',
		'/user.png',
		'/static/user.png',
		'/favicon.png',
		'/static/favicon.png'
	])('uses the site avatar for the default source %s', (source) =>
		expect(usesDefaultProfileImage(source)).toBe(true)
	);

	it.each([
		'data:image/png;base64,uploaded-avatar',
		'https://example.invalid/avatar.png',
		'/uploads/avatar.png',
		'/uploads/user.png'
	])('preserves the authenticated endpoint for a custom source %s', (source) =>
		expect(usesDefaultProfileImage(source)).toBe(false)
	);
});
