"use client";

import { Button } from "@/components/shared/ui/button/Button";
import { useWizard, useWizardState } from "@/wizard";

export default function PageA() {
	const { goToNext } = useWizard();

	// Type-safe state hooks for each field
	const [name, setName] = useWizardState<string>("name");
	const [age, setAge] = useWizardState<number>("age");
	const [address, setAddress] = useWizardState<string>("address");

	return (
		<div className="container mx-auto p-8 max-w-2xl">
			<div className="space-y-6">
				<h1 className="text-3xl font-bold">Page A</h1>
				<p className="text-muted-foreground">
					This is the first page. Fill out all fields to continue.
				</p>

				<div className="space-y-4">
					<div>
						<label htmlFor="name" className="block text-sm font-medium mb-1">
							Name
						</label>
						<input
							id="name"
							type="text"
							value={name || ""}
							onChange={(e) => setName(e.target.value)}
							className="w-full px-3 py-2 border rounded-md"
							placeholder="Enter your name"
						/>
					</div>

					<div>
						<label htmlFor="age" className="block text-sm font-medium mb-1">
							Age
						</label>
						<input
							id="age"
							type="number"
							value={age || ""}
							onChange={(e) => setAge(Number.parseInt(e.target.value, 10) || 0)}
							className="w-full px-3 py-2 border rounded-md"
							placeholder="Enter your age"
						/>
					</div>

					<div>
						<label htmlFor="address" className="block text-sm font-medium mb-1">
							Address
						</label>
						<textarea
							id="address"
							value={address || ""}
							onChange={(e) => setAddress(e.target.value)}
							className="w-full px-3 py-2 border rounded-md"
							placeholder="Enter your address"
							rows={3}
						/>
					</div>
				</div>

				<div className="flex justify-end">
					<Button onClick={goToNext} disabled={!name || !age || !address}>
						Next →
					</Button>
				</div>
			</div>
		</div>
	);
}
