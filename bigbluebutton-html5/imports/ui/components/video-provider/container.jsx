import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { useMutation, useSubscription } from '@apollo/client';
import VideoProvider from './component';
import VideoService from './service';
import { sortVideoStreams } from '/imports/ui/components/video-provider/stream-sorting';
import { CAMERA_BROADCAST_START, CAMERA_BROADCAST_STOP } from './mutations';
import { getVideoData, getVideoDataGrid } from './queries';

const { defaultSorting: DEFAULT_SORTING } = window.meetingClientSettings.public.kurento.cameraSortingModes;

const VideoProviderContainer = ({ children, ...props }) => {
  const { streams, isGridEnabled } = props;
  const [cameraBroadcastStart] = useMutation(CAMERA_BROADCAST_START);
  const [cameraBroadcastStop] = useMutation(CAMERA_BROADCAST_STOP);

  const sendUserShareWebcam = (cameraId) => {
    cameraBroadcastStart({ variables: { cameraId } });
  };

  const sendUserUnshareWebcam = (cameraId) => {
    cameraBroadcastStop({ variables: { cameraId } });
  };

  const playStart = (cameraId) => {
    if (VideoService.isLocalStream(cameraId)) {
      sendUserShareWebcam(cameraId);
      VideoService.joinedVideo();
    }
  };

  return (
    !streams.length && !isGridEnabled
      ? null
      : (
        <VideoProvider
          {...props}
          playStart={playStart}
          sendUserUnshareWebcam={sendUserUnshareWebcam}
        >
          {children}
        </VideoProvider>
      )
  );
};

export default withTracker(({ swapLayout, ...rest }) => {
  const isGridLayout = Session.get('isGridEnabled');
  const graphqlQuery = isGridLayout ? getVideoDataGrid : getVideoData;

  const fetchedStreams = VideoService.fetchVideoStreams();

  const variables = isGridLayout
    ? {}
    : {
      userIds: fetchedStreams.map((stream) => stream.userId) || [],
    };

  const {
    data: videoUserSubscription,
  } = useSubscription(graphqlQuery, { variables });

  const users = videoUserSubscription?.user || [];

  let streams = [];
  let gridUsers = [];
  let totalNumberOfStreams = 0;

  if (isGridLayout) {
    streams = fetchedStreams;
    gridUsers = VideoService.getGridUsers(videoUserSubscription?.user, fetchedStreams);
    totalNumberOfStreams = fetchedStreams.length;
  } else {
    const {
      streams: s,
      totalNumberOfStreams: ts,
    } = VideoService.getVideoStreams();
    streams = s;

    totalNumberOfStreams = ts;
  }

  let usersVideo = streams;

  if (gridUsers.length > 0) {
    const items = usersVideo.concat(gridUsers);
    usersVideo = sortVideoStreams(items, DEFAULT_SORTING);
  }

  return {
    swapLayout,
    streams: usersVideo,
    totalNumberOfStreams,
    isUserLocked: VideoService.isUserLocked(),
    currentVideoPageIndex: VideoService.getCurrentVideoPageIndex(),
    isMeteorConnected: Meteor.status().connected,
    users,
    ...rest,
  };
})(VideoProviderContainer);
