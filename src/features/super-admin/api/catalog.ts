import { api } from "@/shared/lib/axios";

type Envelope<T> = { status: string; message: string; data: T };

export type RegionListItem = {
  id: number;
  name: string;
  code: string;
  primaryLanguage?: string;
  districts: { id: number; name: string; code: string }[];
};

export async function getRegions(): Promise<RegionListItem[]> {
  const res = await api.get<Envelope<RegionListItem[]>>("/regions");
  return res.data.data;
}

export type DiseaseCatalogItem = {
  id: number;
  name: string;
  slug: string;
  code: string;
  description: string | null;
  symptomProfile: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function getDiseaseCatalog(): Promise<DiseaseCatalogItem[]> {
  const res = await api.get<Envelope<DiseaseCatalogItem[]>>("/diseases/catalog");
  return res.data.data;
}

export async function createDiseaseApi(body: {
  name: string;
  code: string;
  slug?: string;
  description?: string;
  symptomProfile?: string;
  isActive?: boolean;
}): Promise<DiseaseCatalogItem> {
  const res = await api.post<Envelope<DiseaseCatalogItem>>("/diseases", body);
  return res.data.data;
}

export async function updateDiseaseApi(
  id: number,
  body: Partial<{
    name: string;
    code: string;
    slug: string;
    description: string | null;
    symptomProfile: string | null;
    isActive: boolean;
  }>,
): Promise<DiseaseCatalogItem> {
  const res = await api.patch<Envelope<DiseaseCatalogItem>>(`/diseases/${id}`, body);
  return res.data.data;
}

export async function deleteDiseaseApi(id: number): Promise<void> {
  await api.delete(`/diseases/${id}`);
}
