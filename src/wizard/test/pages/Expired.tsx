"use client";

export default function Expired() {
	return (
		<div className="container mx-auto p-8 max-w-2xl">
			<div className="space-y-6">
				<h1 className="text-3xl font-bold">This Page is Expired</h1>
				<p className="text-muted-foreground">
					The wizard session has expired or this page is no longer available.
					Please start the wizard from the beginning.
				</p>
			</div>
		</div>
	);
}
