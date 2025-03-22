import { markdownToHtml } from '@starter-kit/utils/renderer/markdownToHtml';
import { Comment } from '../generated/graphql';
import { useAppContext } from './contexts/appContext';
import { Button } from './button';
import { Avatar } from './avatar';

export const PostComments = () => {
	const { post } = useAppContext();
	if (!post) return null;
	const discussionUrl = `https://hashnode.com/discussions/post/${post.id}`;




	const commentsList = post.comments.edges.map((edge) => {
		const comment = edge.node as Comment;
		const content = markdownToHtml(comment.content.markdown);

		return (
			<div
				key={comment.id}
				className="flex flex-col gap-5 rounded-lg border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800"
			>
				<div className="flex items-center">
					<Avatar
						name={comment.author.name}
						picture={comment.author.profilePicture}
					/>
					<div className="ml-2">
						<p className="text-sm font-medium text-slate-900 dark:text-white">{comment.author.name}</p>
					</div>
				</div>
				<div className="prose prose-slate dark:prose-invert" dangerouslySetInnerHTML={{ __html: content }}></div>

			</div>
		);
	});

	return (
		<div className="mx-auto max-w-screen-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 mt-8 w-full">
			<div className="flex items-center justify-between mb-6">
				<h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
					Comments ({post.comments.totalDocuments})
				</h3>
				<Button
					as="a"
					href={discussionUrl}
					target="_blank"
					rel="noopener noreferrer"
					label="Discuss on Hashnode"
					type="primary"
				/>
			</div>
			{post.comments.totalDocuments > 0 ? (
				<div className="flex flex-col gap-5 w-full">{commentsList}</div>
			) : (
				<div className="text-center py-8">
					<p className="text-slate-600 dark:text-slate-400">No comments yet</p>
				</div>
			)}
		</div>
	);
};