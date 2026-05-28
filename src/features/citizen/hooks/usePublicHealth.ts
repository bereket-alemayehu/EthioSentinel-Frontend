import { useQuery } from "@tanstack/react-query";
import { getEthiopiaRegionalStatus, getOutbreakNews, getHealthFacilities, getHealthFacilitiesWithIndicators } from "../api/publicHealth";

export const publicHealthKeys = {
  all: ["public-health"] as const,
  ethiopiaRegionalStatus: (days: number) =>
    [...publicHealthKeys.all, "ethiopia-regions", days] as const,
  outbreakNews: () => [...publicHealthKeys.all, "outbreak-news"] as const,
  healthFacilities: () => [...publicHealthKeys.all, "health-facilities"] as const,
  healthFacilitiesWithIndicators: (days: number) =>
    [...publicHealthKeys.all, "health-facilities-indicators", days] as const,
};

export const useEthiopiaRegionalStatus = (days = 30) => {
  return useQuery({
    queryKey: publicHealthKeys.ethiopiaRegionalStatus(days),
    queryFn: () => getEthiopiaRegionalStatus(days),
    staleTime: 1000 * 60 * 10,
  });
};

export const useOutbreakNews = () => {
  return useQuery({
    queryKey: publicHealthKeys.outbreakNews(),
    queryFn: getOutbreakNews,
    staleTime: 1000 * 60 * 30,
  });
};

export const useHealthFacilities = () => {
  return useQuery({
    queryKey: publicHealthKeys.healthFacilities(),
    queryFn: getHealthFacilities,
    staleTime: 1000 * 60 * 30,
  });
};

export const useHealthFacilitiesWithIndicators = (days = 30) => {
  return useQuery({
    queryKey: publicHealthKeys.healthFacilitiesWithIndicators(days),
    queryFn: () => getHealthFacilitiesWithIndicators(days),
    staleTime: 1000 * 60 * 10,
  });
};
