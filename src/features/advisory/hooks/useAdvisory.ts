import { useQuery, useMutation } from "@tanstack/react-query";
import { getRegions, getAdvisories, checkSymptoms } from "../api";

export const advisoryKeys = {
  all: ["advisory"] as const,
  regions: () => [...advisoryKeys.all, "regions"] as const,
  list: (language?: "ENGLISH" | "AMHARIC") =>
    [...advisoryKeys.all, "list", language ?? "all"] as const,
};

export const useRegions = () => {
  return useQuery({
    queryKey: advisoryKeys.regions(),
    queryFn: getRegions,
    staleTime: 1000 * 60 * 5, // 5 mins
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
};

export const useAdvisories = (language?: "ENGLISH" | "AMHARIC") => {
  return useQuery({
    queryKey: advisoryKeys.list(language),
    queryFn: () => getAdvisories(language),
    staleTime: 1000 * 60 * 5, // 5 mins
  });
};

export const useSymptomCheckMutation = () => {
  return useMutation({
    mutationFn: (args: {
      symptoms: string[];
      language?: "ENGLISH" | "AMHARIC";
    }) => checkSymptoms(args.symptoms, args.language),
  });
};
