import { useEffect, useState } from 'react';

export const ReadProgress = () => {
	const [readingProgress, setReadingProgress] = useState(0);

	const scrollHandler = () => {
		const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
		const progress = (window.scrollY / totalHeight) * 100;
		setReadingProgress(progress);
	};

	useEffect(() => {
		window.addEventListener('scroll', scrollHandler, { passive: true });
		return () => window.removeEventListener('scroll', scrollHandler);
	}, []);

	return (
		<div className="fixed top-0 left-0 z-50 h-1 w-full bg-slate-200 dark:bg-slate-700">
			<div
				className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
				style={{ width: `${readingProgress}%` }}
			/>
		</div>
	);
};