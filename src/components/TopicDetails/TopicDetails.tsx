import gql from 'graphql-tag';
import React, { useState, useEffect } from 'react';
import ReactMde from 'react-mde';
import * as Showdown from 'showdown';
import 'react-mde/lib/styles/css/react-mde-all.css';
import PropTypes from 'prop-types';
import { useQuery, useMutation, useApolloClient } from '@apollo/react-hooks';
import Checklist from '../Checklist/Checklist';

import './TopicDetails.css';

const converter = new Showdown.Converter({
  tables: true,
  simplifiedAutoLink: true,
  strikethrough: true,
  tasklists: true,
});


interface ITopicDetailsProps {
  selectedTopicId: string
}

const GET_TOPIC_DETAILS = gql`
  query gettopics($id: ID!) {
    topics(TopicId: $id) {
      id
      title
      description
      resources
      completed
      rowNumber
      checklist {
        id
        title
        completed
      }
    }
  }
`;

const UPDATE_TOPIC = gql`
  mutation updateTopic($id: ID! $title: String, $description: String $resources: String $rowNumber: Int) {
    updateTopic(id: $id title: $title, description: $description, resources: $resources, rowNumber: $rowNumber) {
      id
      title
      description
      resources
      rowNumber
    }
  }
`;

const TopicDetails : React.FC<ITopicDetailsProps> = ({ selectedTopicId }) => {
  const client = useApolloClient();
  // Get details of selected topic
  const { data, loading } = useQuery(GET_TOPIC_DETAILS, {
    variables: { id: selectedTopicId },
  });

  // Set the initial values foe the local state
  const [titleInput, setTitleInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [resourcesInput, setResourcesInput] = useState('');
  const [selectedTab, setSelectedTab] = useState<'preview' | undefined | 'write' >('write');

  // Set the local state to the previous Topic details
  useEffect(() => {
    if (data && data.topics) {
      setTitleInput(data.topics[0].title);
      setDescriptionInput(data.topics[0].description);
      setResourcesInput(data.topics[0].resources);
    }
  }, [data]);

  const [updateTopic] = useMutation(UPDATE_TOPIC, {
    variables: {
      id: selectedTopicId,
      title: titleInput,
      description: descriptionInput,
      resources: resourcesInput,
    },
  });

  // If there is no selected Topic remove the details component
  if (!selectedTopicId) return null;
  if (loading) return <p>Loading...</p>;
  if (!data) return null;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const inputClass = e.target.className;
    if (inputClass === 'topic-title') setTitleInput(e.target.value);
    if (inputClass === 'topic-description') setDescriptionInput(e.target.value);
    if (inputClass === 'topic-resources') setResourcesInput(e.target.value);
    client.writeData({ data: { selectedTopicTitle: e.target.value } });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await updateTopic();
    client.writeData({ data: { selectedTopicId: '', selectedTopicTitle: '' } });
  };

  return (
    <div className="topic-details-card">
      <form onSubmit={handleSubmit}>
        <div className="title-block">
          <textarea className="topic-title" value={titleInput} onChange={handleChange} />
        </div>
        <div className="description-block">
          <h4>Description:</h4>
          <textarea className="topic-description" value={descriptionInput} onChange={handleChange} />
        </div>
        <div className="resources-block">
          <h4>Resources:</h4>
          <ReactMde
            className="topic-resources"
            value={resourcesInput}
            selectedTab={selectedTab}
            onChange={setResourcesInput}
            onTabChange={setSelectedTab}
            generateMarkdownPreview={(markdown) => Promise.resolve(converter.makeHtml(markdown))}
          />
        </div>
        <button type="submit">Save</button>
      </form>
      <Checklist selectedTopicId={selectedTopicId} />
    </div>
  );
};

TopicDetails.propTypes = {
  selectedTopicId: PropTypes.string.isRequired,
};

export default TopicDetails;
