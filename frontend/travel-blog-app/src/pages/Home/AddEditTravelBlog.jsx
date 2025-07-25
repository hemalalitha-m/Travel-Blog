import React, { useState } from "react";
import { MdAdd, MdUpdate, MdClose } from "react-icons/md";
import DateSelector from "../../components/Input/DateSelector";
import ImageSelector from "../../components/Input/ImageSelector";
import TagInput from "../../components/Input/TagInput";
import axiosInstance from "../../utils/axiosInstance";
import moment from "moment";
import uploadImage from "../../utils/uploadImage";
import { toast } from "react-toastify";

const AddEditTravelBlog = ({ storyInfo, type, onClose, getAllTravelBlogs }) => {
  const [title, setTitle] = useState(storyInfo?.title || "");
  const [storyImg, setStoryImg] = useState(storyInfo?.imageUrl || null);
  const [story, setStory] = useState(storyInfo?.story || "");
  const [visitedLocation, setVisitedLocation] = useState(storyInfo?.visitedLocation || []);
  const [visitedDate, setVisitedDate] = useState(storyInfo?.visitedDate || null);
  const [error, setError] = useState("");

  const clearForm = () => {
    setTitle("");
    setStory("");
    setStoryImg(null);
    setVisitedLocation([]);
    setVisitedDate(null);
  };

  const handleAddTravelBlog = async () => {
    try {
      let imageUrl = "";
      if (storyImg) {
        const imgRes = await uploadImage(storyImg);
        imageUrl = imgRes.imageUrl;
      }
      const response = await axiosInstance.post("/add-travel-blog", {
        title,
        story,
        imageUrl,
        visitedLocation: visitedLocation.filter((loc) => loc.trim()),
        visitedDate: visitedDate ? moment(visitedDate).valueOf() : moment().valueOf(),
      });
      if (response.data?.story) {
        toast.success("Story added successfully");
        getAllTravelBlogs();
        clearForm();
        onClose();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "An unexpected error occurred.");
    }
  };

  const handleUpdateTravelBlog = async () => {
    try {
      const storyId = storyInfo._id;
      let imageUrl = storyInfo.imageUrl || "";
      if (typeof storyImg === "object") {
        const imgRes = await uploadImage(storyImg);
        imageUrl = imgRes.imageUrl;
      }
      const response = await axiosInstance.put(`/edit-blog/${storyId}`, {
        title,
        story,
        imageUrl,
        visitedLocation: visitedLocation.filter((loc) => loc.trim()),
        visitedDate: visitedDate ? moment(visitedDate).valueOf() : moment().valueOf(),
      });
      if (response.data?.story) {
        toast.success("Story updated successfully");
        getAllTravelBlogs();
        onClose();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "An unexpected error occurred.");
    }
  };

  const handleDeleteBlogImg = async () => {
    // If the image is a local file (just selected), clear directly
    if (typeof storyImg === 'object') {
      setStoryImg(null);
      return true;
    }
    // If the image is a URL (existing blog), delete from server
    if (typeof storyImg === 'string' && storyImg) {
      try {
        await axiosInstance.delete("/delete-image", {
          params: { imageUrl: storyImg },
        });
        // update blog record
        const response = await axiosInstance.put(`/edit-blog/${storyInfo._id}`, {
          title,
          story,
          visitedLocation: visitedLocation.filter((loc) => loc.trim()),
          visitedDate: visitedDate ? moment(visitedDate).valueOf() : moment().valueOf(),
          imageUrl: "",
        });
        if (response.data?.story) {
          toast.success("Image deleted successfully");
          setStoryImg(null);
          getAllTravelBlogs();
          return true;
        }
        return false;
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete image");
        return false;
      }
    }
    // Nothing to delete
    toast.warn("No image to delete");
    return false;
  };

  const handleSubmit = () => {
    if (!title.trim()) return setError("Please enter the title.");
    if (!story.trim()) return setError("Please enter the story.");
    setError("");
    if (type === "edit") handleUpdateTravelBlog();
    else handleAddTravelBlog();
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        <h5 className="text-xl font-medium text-slate-700">
          {type === "add" ? "Add Story" : "Update Story"}
        </h5>
        <div className="flex items-center gap-3 bg-cyan-50/50 p-2 rounded-l-lg">
          <button className="btn-small" onClick={handleSubmit}>
            {type === "add" ? <><MdAdd className="text-lg" /> ADD STORY</> : <><MdUpdate className="text-lg" /> UPDATE STORY</>}
          </button>
          <button onClick={onClose}>
            <MdClose className="text-xl text-slate-400" />
          </button>
        </div>
      </div>
      {error && <p className="text-red-500 text-xs pt-2 text-right">{error}</p>}
      <div className="flex-1 flex flex-col gap-2 pt-4">
        <label className="input-label">TITLE</label>
        <input
          type="text"
          className="text-2xl text-slate-950 outline-none"
          placeholder="A Day at the Great Wall"
          value={title}
          onChange={({ target }) => { setTitle(target.value); error && setError(""); }}
        />
        <div className="my-3">
          <DateSelector date={visitedDate} setDate={setVisitedDate} />
        </div>
        <ImageSelector
          image={storyImg}
          setImage={setStoryImg}
          handleDeleteImg={handleDeleteBlogImg}
        />
        <div className="flex flex-col gap-2 mt-4">
          <label className="input-label">STORY</label>
          <textarea
            className="text-sm text-slate-950 outline-none bg-slate-50 p-2 rounded"
            placeholder="Your Story"
            rows={10}
            value={story}
            onChange={({ target }) => { setStory(target.value); error && setError(""); }}
          />
        </div>
        <div className="pt-3">
          <label className="input-label">VISITED LOCATIONS</label>
          <TagInput tags={visitedLocation} setTags={setVisitedLocation} />
        </div>
      </div>
    </div>
  );
};

export default AddEditTravelBlog;
