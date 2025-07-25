import React from "react";
import moment from "moment";
import { GrMapLocation } from "react-icons/gr";
import { MdDeleteOutline, MdUpdate, MdClose } from "react-icons/md";

const ViewTravelBlog = ({ onClose, onEditClick, onDeleteClick, storyInfo }) => {
  return (
    <div className="relative bg-white p-6 rounded-lg shadow-md max-w-3xl mx-auto">
      {/* Top control buttons */}
      <div className="flex items-center justify-end gap-3 mb-4 bg-cyan-50/50 p-2 rounded-l-lg">
        <button className="btn-small" onClick={onEditClick}>
          <MdUpdate className="text-lg" /> UPDATE STORY
        </button>
        <button className="btn-small btn-delete" onClick={onDeleteClick}>
          <MdDeleteOutline className="text-lg" /> DELETE
        </button>
        <button className="icon-btn text-slate-400" onClick={onClose}>
          <MdClose className="text-xl" />
        </button>
      </div>

      {/* Story content */}
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl text-slate-950 font-semibold">
          {storyInfo?.title}
        </h1>

        <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
          <span>{storyInfo ? moment(storyInfo.visitedDate).format("Do MMM YYYY") : ""}</span>

          <div className="inline-flex items-center gap-2 text-[13px] text-cyan-600 bg-cyan-200/40 rounded px-2 py-1">
            <GrMapLocation className="text-sm" />
            {storyInfo?.visitedLocation?.map((item, index) =>
              index === storyInfo.visitedLocation.length - 1 ? item : `${item}, `
            )}
          </div>
        </div>

        {storyInfo?.imgUrl && (
          <img
            src={storyInfo.imgUrl}
            alt="Travel Story"
            className="w-full h-[300px] object-cover rounded-lg"
          />
        )}

        <p className="text-sm text-slate-950 leading-6 text-justify whitespace-pre-line">
          {storyInfo?.story}
        </p>
      </div>
    </div>
  );
};

export default ViewTravelBlog;
