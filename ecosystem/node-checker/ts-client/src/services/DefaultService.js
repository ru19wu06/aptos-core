export class DefaultService {
    httpRequest;
    constructor(httpRequest) {
        this.httpRequest = httpRequest;
    }
    /**
     * Check the health of a given target node. You may specify a baseline
     * node configuration to use for the evaluation. If you don't specify
     * a baseline node configuration, we will attempt to determine the
     * appropriate baseline based on your target node.
     * @returns EvaluationSummary
     * @throws ApiError
     */
    getCheckNode({ nodeUrl, baselineConfigurationName, metricsPort = 9101, apiPort = 8080, noisePort = 6180, publicKey, }) {
        return this.httpRequest.request({
            method: 'GET',
            url: '/check_node',
            query: {
                'node_url': nodeUrl,
                'baseline_configuration_name': baselineConfigurationName,
                'metrics_port': metricsPort,
                'api_port': apiPort,
                'noise_port': noisePort,
                'public_key': publicKey,
            },
        });
    }
    /**
     * Check the health of the preconfigured node. If none was specified when
     * this instance of the node checker was started, this will return an error.
     * You may specify a baseline node configuration to use for the evaluation.
     * If you don't specify a baseline node configuration, we will attempt to
     * determine the appropriate baseline based on your target node.
     * @returns EvaluationSummary
     * @throws ApiError
     */
    getCheckPreconfiguredNode({ baselineConfigurationName, }) {
        return this.httpRequest.request({
            method: 'GET',
            url: '/check_preconfigured_node',
            query: {
                'baseline_configuration_name': baselineConfigurationName,
            },
        });
    }
    /**
     * Get the different baseline configurations the instance of NHC is
     * configured with. This method is best effort, it is infeasible to
     * derive (or even represent) some fields of the spec via OpenAPI,
     * so note that some fields will be missing from the response.
     * @returns NodeConfiguration
     * @throws ApiError
     */
    getGetConfigurations() {
        return this.httpRequest.request({
            method: 'GET',
            url: '/get_configurations',
        });
    }
    /**
     * Get just the keys and pretty names for the configurations, meaning
     * the configuration_name and configuration_name_pretty fields.
     * @returns ConfigurationKey
     * @throws ApiError
     */
    getGetConfigurationKeys() {
        return this.httpRequest.request({
            method: 'GET',
            url: '/get_configuration_keys',
        });
    }
}
