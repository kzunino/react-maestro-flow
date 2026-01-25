"use client";

export default function PageNotFound() {
	return (
		<div className="container mx-auto p-8 max-w-2xl">
			<div className="space-y-6">
				<h1 className="text-3xl font-bold">Page Not Found</h1>
				<p className="text-muted-foreground">
					The page you're looking for doesn't exist in this wizard. Please check
					the URL and try again.
				</p>
			</div>
		</div>
	);
}
