import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { MdAdd } from "react-icons/md";
import Modal from "react-modal";
import TravelBlogCard from "../../components/Cards/TravelBlogCard";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AddEditTravelBlog from "./AddEditTravelBlog";
import ViewTravelBlog from "./ViewTravelBlog";
import EmptyCard from "../../components/Cards/EmptyCard";
import { DayPicker } from "react-day-picker";
import moment from "moment";
import FilterInfoTitle from "../../components/Cards/FilterInfoTitle";

const Home = () => {
  const navigate = useNavigate();

  const [userInfo, setUserInfo] = useState(null);
  const [allBlogs, setAllBlogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [dateRange, setDateRange] = useState({ from: null, to: null });

  const [addEditModal, setAddEditModal] = useState({ isOpen: false, type: "add", data: null });
  const [viewModal, setViewModal] = useState({ isOpen: false, data: null });

  useEffect(() => {
    fetchUserInfo();
    fetchAllBlogs();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await axiosInstance.get("/get-user");
      if (response.data?.user) setUserInfo(response.data.user);
    } catch (error) {
      console.error("Error fetching user info:", error);
      if (error.response?.status === 401) {
        localStorage.clear();
        navigate("/login");
      }
    }
  };

  const fetchAllBlogs = async () => {
    try {
      const response = await axiosInstance.get("/get-all-blogs");
      setAllBlogs(Array.isArray(response.data?.blogs) ? response.data.blogs : []);
    } catch (error) {
      console.error("Fetch blogs error:", error);
      toast.error("Failed to fetch blogs.");
      setAllBlogs([]);
    }
  };

  const searchStories = async (query) => {
    if (!query.trim()) {
      toast.warn("Please enter something to search.");
      return;
    }

    try {
      const response = await axiosInstance.get("/search", {
        params: { query },
      });
      setAllBlogs(response.data?.stories || []);
      setFilterType("search");
    } catch (error) {
      console.error("Error during search:", error.response?.data || error.message);
      toast.error("Error during search.");
    }
  };

  const filterStoriesByDate = async (range) => {
    try {
      const from = range.from ? moment(range.from).valueOf() : null;
      const to = range.to ? moment(range.to).valueOf() : null;
      if (!from || !to) return;

      const response = await axiosInstance.get("/travel-stories/filter", {
        params: { startDate: from, endDate: to },
      });
      setAllBlogs(response.data?.stories || []);
      setFilterType("date");
    } catch (error) {
      console.error("Date filter error:", error);
      toast.error("Error during date filtering.");
    }
  };

  const updateIsFavourite = async (blog) => {
    try {
      await axiosInstance.put(`/update-is-favourite/${blog._id}`, {
        isFavourite: !blog.isFavourite,
      });
      toast.success("Updated successfully.");
      refreshFilteredData();
    } catch (error) {
      console.error("Favourite update error:", error);
      toast.error("Could not update favourite.");
    }
  };

  const deleteBlog = async (blog) => {
    try {
      await axiosInstance.delete(`/delete-blog/${blog._id}`);
      toast.success("Deleted successfully.");
      setViewModal({ isOpen: false, data: null });
      refreshFilteredData();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete.");
    }
  };

  const refreshFilteredData = () => {
    if (filterType === "search") {
      searchStories(searchQuery);
    } else if (filterType === "date") {
      filterStoriesByDate(dateRange);
    } else {
      fetchAllBlogs();
    }
  };

  // ** NEW clearFilters function **
  const clearFilters = () => {
    setSearchQuery("");
    setDateRange({ from: null, to: null });
    setFilterType("");
    fetchAllBlogs();
  };

  return (
    <>
      <Navbar
        userInfo={userInfo}
        searchQuery={searchQuery}
        setSearchQuery={(value) => {
          setSearchQuery(value);
          if (!value.trim()) {
            clearFilters();  // Clear filters when search input is emptied
          }
        }}
        onSearchNote={searchStories}
        handleClearSearch={clearFilters}
      />

      <div className="container mx-auto py-10">
        <FilterInfoTitle filterType={filterType} filterDates={dateRange} onClear={clearFilters} />

        <div className="flex gap-7">
          <div className="flex-1">
            {allBlogs.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {allBlogs.map((blog) => (
                  <TravelBlogCard
                    key={blog._id}
                    imgUrl={blog.imageUrl}
                    title={blog.title}
                    story={blog.story}
                    date={blog.visitedDate} // always use visitedDate
                    visitedLocation={blog.visitedLocation}
                    isFavourite={blog.isFavourite}
                    onClick={() => setViewModal({ isOpen: true, data: blog })}
                    onFavouriteClick={() => updateIsFavourite(blog)}
                    onDeleteClick={() => deleteBlog(blog)}
                  />
                ))}
              </div>
            ) : (
              <EmptyCard
                message={
                  filterType === "search" && searchQuery
                    ? `No results for "${searchQuery}".`
                    : filterType === "date" && dateRange.from && dateRange.to
                    ? `No stories between ${moment(dateRange.from).format("MMM D, YYYY")} and ${moment(dateRange.to).format("MMM D, YYYY")}.`
                    : "No stories yet. Click '+' to start one!"
                }
              />
            )}
          </div>

          <div className="w-[350px]">
            <div className="bg-white border border-slate-200 shadow-lg rounded-lg p-3">
              <DayPicker
                captionLayout="dropdown-buttons"
                mode="range"
                selected={dateRange}
                onSelect={(range) => {
                  setDateRange(range);
                  filterStoriesByDate(range);
                }}
                pagedNavigation
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={addEditModal.isOpen}
        onRequestClose={() => setAddEditModal({ isOpen: false, type: "add", data: null })}
        className="model-box"
        style={{ overlay: { backgroundColor: "rgba(0,0,0,0.2)", zIndex: 999 } }}
        appElement={document.getElementById("root")}
      >
        <AddEditTravelBlog
          type={addEditModal.type}
          storyInfo={addEditModal.data}
          onClose={() => setAddEditModal({ isOpen: false, type: "add", data: null })}
          getAllTravelBlogs={fetchAllBlogs}
        />
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={viewModal.isOpen}
        onRequestClose={() => setViewModal({ isOpen: false, data: null })}
        className="model-box"
        style={{ overlay: { backgroundColor: "rgba(0,0,0,0.2)", zIndex: 999 } }}
        appElement={document.getElementById("root")}
      >
        <ViewTravelBlog
          storyInfo={viewModal.data}
          onClose={() => setViewModal({ isOpen: false, data: null })}
          onEditClick={() => {
            setViewModal({ isOpen: false, data: null });
            setAddEditModal({ isOpen: true, type: "edit", data: viewModal.data });
          }}
          onDeleteClick={() => deleteBlog(viewModal.data)}
        />
      </Modal>

      <button
        className="w-16 h-16 flex items-center justify-center rounded-full bg-primary hover:bg-cyan-400 fixed right-10 bottom-10"
        onClick={() => setAddEditModal({ isOpen: true, type: "add", data: null })}
      >
        <MdAdd className="text-[32px] text-white" />
      </button>

      <ToastContainer />
    </>
  );
};

export default Home;
