import React from "react";
import { Modal } from "@/shared/components/ui/Modal";
import { SearchableSelect } from "@/shared/components/ui/SearchableSelect";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";

interface EditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  editForm: any;
  setEditForm: (form: any) => void;
  diseaseOptions: any[];
  handleEditSave: (e: React.FormEvent) => void;
  t: any;
}

export const EditReportModal: React.FC<EditReportModalProps> = ({
  isOpen,
  onClose,
  editForm,
  setEditForm,
  diseaseOptions,
  handleEditSave,
  t
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Field Report"
      className="max-w-2xl text-dark-300 dark:text-white"
    >
      <form onSubmit={handleEditSave} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-light-500 uppercase tracking-widest ml-1">Pathogen ID</label>
            <SearchableSelect 
              options={diseaseOptions}
              value={editForm.diseaseType}
              onChange={(label, id) => setEditForm({ ...editForm, diseaseType: label, diseaseId: id as number })}
              placeholder="Search or Select Disease..."
              className="z-50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-light-500 uppercase tracking-widest ml-1">Date</label>
            <Input
              type="date"
              value={editForm.date}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({ ...editForm, date: e.target.value })}
              required
              className="h-12 bg-light-700/40 dark:bg-white/5 border-white/10 rounded-xl font-black"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-light-500 uppercase tracking-widest ml-1">Cases</label>
              <Input
                type="number"
                value={editForm.cases}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({ ...editForm, cases: Number(e.target.value) })}
                required
                className="h-12 bg-light-700/40 dark:bg-white/5 border-white/10 rounded-xl font-black text-center"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-light-500 uppercase tracking-widest ml-1">Deaths</label>
              <Input
                type="number"
                value={editForm.deaths}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({ ...editForm, deaths: Number(e.target.value) })}
                required
                className={`h-12 bg-light-700/40 dark:bg-white/5 rounded-xl font-black text-center ${
                    editForm.deaths > editForm.cases 
                        ? 'border-red-500 text-red-600 focus:ring-red-500/20' 
                        : 'border-white/10 text-red-500'
                }`}
              />
              {editForm.deaths > editForm.cases && (
                <p className="text-[9px] font-black text-red-500 uppercase tracking-tighter ml-1">
                  Mortality cannot exceed case count
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="flex-1 h-14 rounded-xl font-black uppercase tracking-widest text-[10px]"
          >
            Discard Changes
          </Button>
          <Button 
            type="submit" 
            disabled={editForm.deaths > editForm.cases}
            className={`flex-1 h-14 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${
                editForm.deaths > editForm.cases 
                    ? 'bg-slate-300 dark:bg-white/10 cursor-not-allowed text-light-500' 
                    : 'primary-gradient text-white shadow-lg shadow-primary-500/20'
            }`}
          >
            Update Record
          </Button>
        </div>
      </form>
    </Modal>
  );
};
