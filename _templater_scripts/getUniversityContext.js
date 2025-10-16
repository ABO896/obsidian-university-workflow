/*
  getUniversityContext.js
  
  This is a reusable user script for Templater.
  It takes a file object and returns its academic context.
  
  Usage in a template:
  const context = await tp.user.getUniversityContext(tp.config.target_file);
  const subject = context.subject;
  const parcial = context.parcial;
*/
function getUniversityContext(targetFile) {
	if (!targetFile) {
		// Return defaults if no file is provided
		return { subject: 'General', parcial: 'General' };
	}

	const pathParts = targetFile.parent.path.split('/');

	// Find Subject
	const uniIndex = pathParts.indexOf('Universidad');
	let subject = 'General';
	if (uniIndex !== -1 && pathParts.length > uniIndex + 1) {
		subject = pathParts[uniIndex + 1];
	}

	// Find Parcial
	let parcial = 'General';
	const parcialPart = pathParts.find((p) =>
		p.toLowerCase().startsWith('parcial')
	);
	if (parcialPart) {
		parcial = parcialPart;
	}

	// Return a clean object with the results
	return {
		subject: subject,
		parcial: parcial,
	};
}

module.exports = getUniversityContext;
