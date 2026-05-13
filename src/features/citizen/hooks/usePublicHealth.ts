import { useQuery } from "@tanstack/react-query";
import { getEthiopiaRegionalStatus, getOutbreakNews } from "../api/publicHealth";

export const publicHealthKeys = {
  all: ["public-health"] as const,
  ethiopiaRegionalStatus: (days: number) =>
    [...publicHealthKeys.all, "ethiopia-regions", days] as const,
  outbreakNews: () => [...publicHealthKeys.all, "outbreak-news"] as const,
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
