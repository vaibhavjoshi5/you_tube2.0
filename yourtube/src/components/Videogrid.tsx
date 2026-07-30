import React, { useEffect, useState } from "react";
import Videocard from "./videocard";
import axiosInstance from "@/lib/axiosinstance";

const Videogrid = () => {
  const [videos, setvideo] = useState<any>(null);
  const [loading, setloading] = useState(true);
  useEffect(() => {
    const fetchvideo = async () => {
      try {
        const res = await axiosInstance.get("/video/getall");
        setvideo(res.data);
      } catch (error) {
        console.log(error);
      } finally {
        setloading(false);
      }
    };
    fetchvideo();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {loading ? (
        Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="animate-pulse space-y-3">
            <div className="aspect-video rounded-xl bg-slate-200" />
            <div className="flex gap-3">
              <div className="h-9 w-9 rounded-full bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 rounded bg-slate-200" />
                <div className="h-3 w-2/3 rounded bg-slate-100" />
              </div>
            </div>
          </div>
        ))
      ) : !videos?.length ? (
        <div className="col-span-full rounded-2xl border border-dashed p-10 text-center text-sm text-slate-500">
          No videos are available yet.
        </div>
      ) : (
        videos.map((video: any) => <Videocard key={video._id} video={video} />)
      )}
    </div>
  );
};

export default Videogrid;
