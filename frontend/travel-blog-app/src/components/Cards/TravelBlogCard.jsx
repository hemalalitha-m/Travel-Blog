import React from "react";
import moment from "moment";
import { FaHeart } from "react-icons/fa6";
import { GrMapLocation } from "react-icons/gr";

const TravelBlogCard = ({
  imgUrl,
  title,
  date,                 // now the single source of truth
  story,
  visitedLocation = [],
  isFavourite = false,
  onFavouriteClick = () => {},
  onClick = () => {},
}) => {
  return (
    <div
      className="m-5 border rounded-lg overflow-hidden bg-white hover:shadow-lg hover:shadow-slate-200 transition-all ease-in-out relative cursor-pointer"
      onClick={onClick}
    >
      <img
        src={imgUrl}
        alt={title}
        className="w-full h-56 object-cover rounded-t-lg"
      />

      <button
        type="button"
        className="w-10 h-10 flex items-center justify-center bg-white/70 rounded-full border border-white absolute top-4 right-4 z-10"
        onClick={e => {
          e.stopPropagation();
          onFavouriteClick();
        }}
      >
        <FaHeart
          className={`text-lg transition-colors ${
            isFavourite ? "text-red-500" : "text-gray-400"
          }`}
        />
      </button>

      <div className="p-4">
        <div className="mb-1">
          <h6 className="text-base font-semibold truncate">{title}</h6>
          <span className="text-xs text-gray-500">
            {date ? moment(date).format("DD MMM YYYY") : "-"}
          </span>
        </div>

        <p className="text-sm text-gray-700 mt-2 line-clamp-2">{story}</p>

        {visitedLocation.length > 0 && (
          <div className="inline-flex items-center gap-2 text-[13px] text-cyan-600 bg-cyan-100 rounded mt-3 px-2 py-1">
            <GrMapLocation className="text-sm" />
            <span className="truncate">{visitedLocation.join(", ")}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TravelBlogCard;
