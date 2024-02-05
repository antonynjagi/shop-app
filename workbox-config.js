module.exports = {
	globDirectory: './',
	globPatterns: [
		'**/*.{png,js,css,html,json,md}'
	],
	swDest: 'sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	]
};