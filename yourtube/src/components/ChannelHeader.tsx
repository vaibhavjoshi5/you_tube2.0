import { useState } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";

interface ChannelSummary {
  _id: string;
  name?: string;
  channelname?: string;
  description?: string;
}

interface SignedInUserSummary {
  _id?: string;
}

interface ChannelHeaderProps {
  channel: ChannelSummary;
  user?: SignedInUserSummary | null;
}

const ChannelHeader = ({ channel, user }: ChannelHeaderProps) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const channelName =
    channel.channelname || channel.name || "YourTube channel";
  const isDifferentUser =
    Boolean(user?._id) && String(user?._id) !== String(channel._id);

  return (
    <div className="w-full">
      <div className="relative h-32 overflow-hidden bg-gradient-to-r from-blue-400 to-purple-500 md:h-48 lg:h-64" />

      <div className="px-4 py-6">
        <div className="flex flex-col items-start gap-6 md:flex-row">
          <Avatar className="h-20 w-20 md:h-32 md:w-32">
            <AvatarFallback className="text-2xl">
              {channelName[0]?.toUpperCase() || "Y"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <h1 className="text-2xl font-bold md:text-4xl">
              {channelName}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>
                @{channelName.toLowerCase().replace(/\s+/g, "")}
              </span>
            </div>
            {channel.description && (
              <p className="max-w-2xl text-sm text-gray-700">
                {channel.description}
              </p>
            )}
          </div>

          {isDifferentUser && (
            <div className="flex gap-2">
              <Button
                onClick={() =>
                  setIsSubscribed((currentValue) => !currentValue)
                }
                variant={isSubscribed ? "outline" : "default"}
                className={
                  isSubscribed
                    ? "bg-gray-100"
                    : "bg-red-600 hover:bg-red-700"
                }
              >
                {isSubscribed ? "Subscribed" : "Subscribe"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelHeader;
