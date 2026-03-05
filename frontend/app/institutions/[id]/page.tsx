import { redirect } from 'next/navigation';

export default function InstitutionRootPage({ params }: { params: { id: string } }) {
  redirect(`/institutions/${params.id}/analytics`);
}
